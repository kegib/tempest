/**
 * radarApi.ts
 *
 * Client-side radar pipeline:
 *  1. Geocode a location string → { lat, lon } via Open-Meteo
 *  2. Convert lat/lon + zoom to a slippy-map tile coordinate
 *  3. Fetch the latest RainViewer radar timestamp
 *  4. Fetch the 512 px PNG radar tile via CORS proxy
 *  5. Rasterise the PNG onto an off-screen <canvas> and downsample
 *     each cell to a rain-intensity ASCII character
 */

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

function proxied(url: string): string {
  return `${CORS_PROXY}${encodeURIComponent(url)}`;
}

// ─── 1. Geocoding ─────────────────────────────────────────────────────────────

export interface GeoLocation {
  name: string;
  lat: number;
  lon: number;
  country: string;
}

export async function geocode(location: string): Promise<GeoLocation> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location.trim())}&count=1`;
  const res = await fetch(proxied(url), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Geocoding request failed: ${res.status}`);
  const json = await res.json();
  const result = json?.results?.[0];
  if (!result) throw new Error(`Location not found: "${location}"`);
  return {
    name: result.name ?? location,
    lat: result.latitude,
    lon: result.longitude,
    country: result.country ?? '',
  };
}

// ─── 2. Slippy-map tile math ─────────────────────────────────────────────────

export interface TileCoord {
  x: number;
  y: number;
  zoom: number;
}

export function latLonToTile(lat: number, lon: number, zoom: number): TileCoord {
  const x = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom),
  );
  return { x, y, zoom };
}

// ─── 3. RainViewer API ────────────────────────────────────────────────────────

interface RainViewerFrame {
  time: number;
  path: string;
}

interface RainViewerResponse {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RainViewerFrame[];
    nowcast: RainViewerFrame[];
  };
}

export interface RadarFrame {
  time: number;       // unix timestamp
  path: string;       // e.g. "/v2/radar/1234567890"
  host: string;       // e.g. "https://tilecache.rainviewer.com"
}

export async function fetchLatestRadarFrame(): Promise<RadarFrame> {
  const url = 'https://api.rainviewer.com/public/weather-maps.json';
  const res = await fetch(proxied(url), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`RainViewer API failed: ${res.status}`);
  const json: RainViewerResponse = await res.json();
  const frames = json.radar?.past;
  if (!frames?.length) throw new Error('No radar frames available');
  const latest = frames[frames.length - 1];
  return { time: latest.time, path: latest.path, host: json.host };
}

/** Build the full URL for a 512-px radar tile */
export function radarTileUrl(frame: RadarFrame, tile: TileCoord): string {
  // RainViewer tile URL format:
  // {host}{path}/512/{zoom}/{x}/{y}/4/1_1.png
  // colour scheme 4 = standard radar colours; smooth=1, snow=1
  return `${frame.host}${frame.path}/512/${tile.zoom}/${tile.x}/${tile.y}/4/1_1.png`;
}

// ─── 4. PNG → ASCII art ───────────────────────────────────────────────────────

/**
 * Maps an RGBA pixel to a rain-intensity character.
 *
 * RainViewer uses a standard DBZ colour scale rendered onto a transparent
 * background. We ignore the base-map layer entirely and only look at pixels
 * with significant alpha.  The colour gradient goes roughly:
 *   light blue  → light green → yellow → orange → red → purple  (increasing intensity)
 *
 * We convert to HSL and use hue + saturation as a proxy for intensity:
 *   transparent / grey  →  ' '   (no precipitation)
 *   light / cool         →  '·'   (drizzle / light rain <0.5 mm/h)
 *   green                →  '░'   (light rain ~1 mm/h)
 *   yellow-green         →  '▒'   (moderate rain ~5 mm/h)
 *   yellow/orange        →  '▓'   (heavy rain ~15 mm/h)
 *   red/purple           →  '█'   (intense / extreme >50 mm/h)
 */
function pixelToChar(r: number, g: number, b: number, a: number): string {
  if (a < 30) return ' '; // transparent – no data

  // Normalise
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  if (delta < 0.08) return ' '; // achromatic / grey – no precip

  // Compute hue (0–360)
  let hue = 0;
  if (max === rn) hue = 60 * (((gn - bn) / delta) % 6);
  else if (max === gn) hue = 60 * ((bn - rn) / delta + 2);
  else hue = 60 * ((rn - gn) / delta + 4);
  if (hue < 0) hue += 360;

  const sat = max === 0 ? 0 : delta / max;
  if (sat < 0.25) return ' ';

  // Map hue to intensity level
  // Blues (180-240):     very light
  // Cyans (160-180):     light
  // Greens (90-160):     moderate
  // Yellow-green (70-90): moderate-heavy
  // Yellow/orange (30-70): heavy
  // Red/pink (0-30 or 330-360): intense
  // Purple (270-330):    extreme

  if (hue >= 270 && hue <= 330) return '█'; // purple – extreme
  if ((hue >= 330 || hue <= 20) && sat > 0.5) return '█'; // red   – intense
  if (hue > 20 && hue <= 45) return '▓';  // orange
  if (hue > 45 && hue <= 80) return '▓';  // yellow
  if (hue > 80 && hue <= 130) return '▒'; // green
  if (hue > 130 && hue <= 175) return '░'; // cyan-green
  if (hue > 175 && hue <= 260) return '·'; // blue (lightest rain)
  return ' ';
}

/**
 * Collapses a block of `blockW × blockH` pixels into a single character by
 * taking the maximum intensity in the block.
 */
const INTENSITY_ORDER = [' ', '·', '░', '▒', '▓', '█'];

function maxChar(chars: string[]): string {
  let best = 0;
  for (const c of chars) {
    const idx = INTENSITY_ORDER.indexOf(c);
    if (idx > best) best = idx;
  }
  return INTENSITY_ORDER[best];
}

/**
 * ANSI terminal colour class for each intensity level.
 * These map to the CSS variables defined in index.css.
 */
export function charColourClass(ch: string): string {
  switch (ch) {
    case '█': return 'text-ansi-red';
    case '▓': return 'text-ansi-yellow';
    case '▒': return 'text-ansi-green';
    case '░': return 'text-ansi-cyan';
    case '·': return 'text-ansi-blue';
    default:  return 'text-ansi-dim';
  }
}

export interface AsciiRadar {
  rows: string[][];        // rows[y][x] = character
  cols: number;
  lines: number;
  timestamp: number;       // unix seconds of the radar frame
  locationName: string;
  lat: number;
  lon: number;
  zoom: number;
  tileX: number;
  tileY: number;
}

/**
 * Full radar pipeline: coordinates → AsciiRadar
 *
 * @param lat          Latitude (already resolved by caller)
 * @param lon          Longitude (already resolved by caller)
 * @param locationName Display name for the header
 * @param zoom         Slippy zoom level (default 6, range 1-10)
 * @param cols         Target ASCII art width in characters (default 60)
 * @param lines        Target ASCII art height in lines (default 22)
 */
export async function fetchRadar(
  lat: number,
  lon: number,
  locationName: string,
  zoom = 6,
  cols = 60,
  lines = 22,
): Promise<AsciiRadar> {
  // Clamp zoom
  const z = Math.max(1, Math.min(10, zoom));

  // Step 1 – tile coordinate (lat/lon already resolved by caller)
  const geo: GeoLocation = { lat, lon, name: locationName, country: '' };
  const tile = latLonToTile(geo.lat, geo.lon, z);

  // Step 3 – latest radar frame
  const frame = await fetchLatestRadarFrame();

  // Step 4 – fetch PNG via CORS proxy and draw onto canvas
  const tileUrl = radarTileUrl(frame, tile);
  const imgBlob = await fetch(proxied(tileUrl)).then((r) => {
    if (!r.ok) throw new Error(`Radar tile fetch failed: ${r.status}`);
    return r.blob();
  });

  const bitmap = await createImageBitmap(imgBlob);
  const TILE_SIZE = 512; // RainViewer tiles are 512×512
  const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('OffscreenCanvas context unavailable');
  ctx.drawImage(bitmap, 0, 0);
  const { data: pixels } = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);

  // Step 5 – downsample to ASCII grid
  // Each ASCII cell covers blockW × blockH pixels
  const blockW = Math.floor(TILE_SIZE / cols);
  const blockH = Math.floor(TILE_SIZE / lines);

  const rows: string[][] = [];
  for (let row = 0; row < lines; row++) {
    const cells: string[] = [];
    for (let col = 0; col < cols; col++) {
      const chars: string[] = [];
      for (let py = 0; py < blockH; py++) {
        for (let px = 0; px < blockW; px++) {
          const imgX = col * blockW + px;
          const imgY = row * blockH + py;
          const idx = (imgY * TILE_SIZE + imgX) * 4;
          chars.push(pixelToChar(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]));
        }
      }
      cells.push(maxChar(chars));
    }
    rows.push(cells);
  }

  return {
    rows,
    cols,
    lines,
    timestamp: frame.time,
    locationName,
    lat,
    lon,
    zoom: z,
    tileX: tile.x,
    tileY: tile.y,
  };
}
