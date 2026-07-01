/**
 * Polyfill for AbortSignal.any()
 * Creates an AbortSignal aborted when any of the provided signals are aborted.
 */
if (!AbortSignal.any) {
  AbortSignal.any = function (signals: AbortSignal[]): AbortSignal {
    if (signals.length === 0) return new AbortController().signal;
    if (signals.length === 1) return signals[0];

    for (const signal of signals) {
      if (signal.aborted) {
        const c = new AbortController();
        c.abort(signal.reason);
        return c.signal;
      }
    }

    const controller = new AbortController();
    const onAbort = (event: Event) => {
      controller.abort((event.target as AbortSignal).reason);
    };
    for (const signal of signals) {
      signal.addEventListener('abort', onAbort, { once: true });
    }
    controller.signal.addEventListener('abort', () => {
      for (const signal of signals) signal.removeEventListener('abort', onAbort);
    }, { once: true });
    return controller.signal;
  };
}

/**
 * Polyfill for AbortSignal.timeout()
 * Creates an AbortSignal aborted after the specified milliseconds.
 */
if (!AbortSignal.timeout) {
  AbortSignal.timeout = function (milliseconds: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
    }, milliseconds);
    return controller.signal;
  };
}
