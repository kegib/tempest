// Types for wttr.in JSON API response

export interface WttrCurrentCondition {
  FeelsLikeC: string;
  FeelsLikeF: string;
  cloudcover: string;
  humidity: string;
  localObsDateTime: string;
  observation_time: string;
  precipInches: string;
  precipMM: string;
  pressure: string;
  pressureInches: string;
  temp_C: string;
  temp_F: string;
  uvIndex: string;
  visibility: string;
  visibilityMiles: string;
  weatherCode: string;
  weatherDesc: { value: string }[];
  weatherIconUrl: { value: string }[];
  winddir16Point: string;
  winddirDegree: string;
  windspeedKmph: string;
  windspeedMiles: string;
}

export interface WttrHourly {
  DewPointC: string;
  DewPointF: string;
  FeelsLikeC: string;
  FeelsLikeF: string;
  HeatIndexC: string;
  HeatIndexF: string;
  WindChillC: string;
  WindChillF: string;
  WindGustKmph: string;
  WindGustMiles: string;
  chanceoffog: string;
  chanceoffrost: string;
  chanceofhightemp: string;
  chanceofovercast: string;
  chanceofrain: string;
  chanceofsnow: string;
  chanceofsunshine: string;
  chanceofthunder: string;
  chanceofwindy: string;
  cloudcover: string;
  humidity: string;
  precipInches: string;
  precipMM: string;
  pressure: string;
  pressureInches: string;
  tempC: string;
  tempF: string;
  time: string;
  uvIndex: string;
  visibility: string;
  visibilityMiles: string;
  weatherCode: string;
  weatherDesc: { value: string }[];
  weatherIconUrl: { value: string }[];
  winddir16Point: string;
  winddirDegree: string;
  windspeedKmph: string;
  windspeedMiles: string;
}

export interface WttrWeather {
  astronomy: {
    moon_illumination: string;
    moon_phase: string;
    moonrise: string;
    moonset: string;
    sunrise: string;
    sunset: string;
  }[];
  avgtempC: string;
  avgtempF: string;
  date: string;
  hourly: WttrHourly[];
  maxtempC: string;
  maxtempF: string;
  mintempC: string;
  mintempF: string;
  sunHour: string;
  totalSnow_cm: string;
  uvIndex: string;
}

export interface WttrNearestArea {
  areaName: { value: string }[];
  country: { value: string }[];
  latitude: string;
  longitude: string;
  population: string;
  region: { value: string }[];
  weatherUrl: { value: string }[];
}

export interface WttrResponse {
  current_condition: WttrCurrentCondition[];
  nearest_area: WttrNearestArea[];
  request: { query: string; type: string }[];
  weather: WttrWeather[];
}

// Parsed/normalised structures used by the UI

export interface CurrentWeather {
  tempC: number;
  tempF: number;
  feelsLikeC: number;
  feelsLikeF: number;
  description: string;
  weatherCode: number;
  humidity: number;
  windspeedKmph: number;
  winddir: string;
  visibilityKm: number;
  cloudcover: number;
  uvIndex: number;
  precipMM: number;
  observationTime: string;
}

export interface HourlyForecast {
  time: number; // 0–2300
  tempC: number;
  feelsLikeC: number;
  description: string;
  weatherCode: number;
  precipMM: number;
  chanceOfRain: number;
  windspeedKmph: number;
  winddir: string;
}

export interface DailyForecast {
  date: string;
  maxTempC: number;
  minTempC: number;
  avgTempC: number;
  description: string;
  weatherCode: number;
  sunrise: string;
  sunset: string;
  uvIndex: number;
  hourly: HourlyForecast[];
}

export interface LocationInfo {
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
}

export interface WeatherData {
  location: LocationInfo;
  current: CurrentWeather;
  forecast: DailyForecast[];
  query: string;
}
