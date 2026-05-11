class CircuitOpenError extends Error {
  constructor(service) {
    super(`Circuit breaker open for ${service}`);
    this.code = "CIRCUIT_OPEN";
    this.service = service;
  }
}

/**
 * Minimal circuit breaker: CLOSED -> OPEN after consecutive failures, half-open probe after reset timeout.
 * @param {{ name: string, errorThreshold?: number, resetTimeoutMs?: number }} opts
 */
function createCircuitBreaker(opts) {
  const name = opts.name;
  const errorThreshold = Math.max(1, Number(opts.errorThreshold) || 5);
  const resetTimeoutMs = Math.max(1, Number(opts.resetTimeoutMs) || 15000);

  let state = "CLOSED";
  let failures = 0;
  let openedAt = null;

  function tryOpenToHalfOpen() {
    if (state !== "OPEN" || openedAt == null) {
      return;
    }
    if (Date.now() - openedAt >= resetTimeoutMs) {
      state = "HALF_OPEN";
    }
  }

  function recordSuccess() {
    failures = 0;
    state = "CLOSED";
  }

  function recordFailure() {
    if (state === "HALF_OPEN") {
      state = "OPEN";
      openedAt = Date.now();
      failures = 0;
      return;
    }
    failures += 1;
    if (failures >= errorThreshold) {
      state = "OPEN";
      openedAt = Date.now();
      failures = 0;
    }
  }

  /**
   * @param {() => Promise<any>} fn
   * @param {{ httpResponse?: boolean }} [runOpts] If httpResponse, status >= 500 counts as failure (axios shape).
   */
  async function run(fn, runOpts = {}) {
    tryOpenToHalfOpen();
    if (state === "OPEN") {
      throw new CircuitOpenError(name);
    }

    try {
      const result = await fn();
      const httpMode = Boolean(runOpts.httpResponse);
      const badHttp =
        httpMode &&
        result &&
        typeof result === "object" &&
        typeof result.status === "number" &&
        result.status >= 500;

      if (badHttp) {
        recordFailure();
        return result;
      }
      recordSuccess();
      return result;
    } catch (err) {
      recordFailure();
      throw err;
    }
  }

  function getState() {
    tryOpenToHalfOpen();
    return { name, state, failures };
  }

  return { run, getState };
}

module.exports = { createCircuitBreaker, CircuitOpenError };
