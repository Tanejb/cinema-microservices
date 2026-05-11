from __future__ import annotations

import threading
import time
from typing import Any, Callable


class CircuitOpenError(Exception):
    def __init__(self, service: str) -> None:
        self.service = service
        super().__init__(f"Circuit breaker open for {service}")


class CircuitBreaker:
    """CLOSED -> OPEN after consecutive failures; single probe after reset timeout."""

    def __init__(
        self,
        name: str,
        *,
        error_threshold: int = 5,
        reset_timeout_ms: int = 15000,
    ) -> None:
        self._name = name
        self._threshold = max(1, int(error_threshold))
        self._reset_ms = max(1, int(reset_timeout_ms))
        self._lock = threading.Lock()
        self._state = "CLOSED"
        self._failures = 0
        self._opened_at: float | None = None

    def _try_open_to_half_open(self) -> None:
        if self._state != "OPEN" or self._opened_at is None:
            return
        if (time.monotonic() - self._opened_at) * 1000 >= self._reset_ms:
            self._state = "HALF_OPEN"

    def _record_success(self) -> None:
        self._failures = 0
        self._state = "CLOSED"

    def _record_failure(self) -> None:
        if self._state == "HALF_OPEN":
            self._state = "OPEN"
            self._opened_at = time.monotonic()
            self._failures = 0
            return
        self._failures += 1
        if self._failures >= self._threshold:
            self._state = "OPEN"
            self._opened_at = time.monotonic()
            self._failures = 0

    def run(self, fn: Callable[[], Any], *, http_response: bool = False) -> Any:
        with self._lock:
            self._try_open_to_half_open()
            if self._state == "OPEN":
                raise CircuitOpenError(self._name)

        try:
            result = fn()
        except Exception:
            with self._lock:
                self._record_failure()
            raise

        bad_http = False
        if http_response and result is not None:
            status = getattr(result, "status_code", None)
            if isinstance(status, int) and status >= 500:
                bad_http = True

        with self._lock:
            if bad_http:
                self._record_failure()
            else:
                self._record_success()

        return result
