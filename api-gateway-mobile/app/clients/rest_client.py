from __future__ import annotations

import requests


def _merge_correlation_headers(kwargs: dict) -> None:
    try:
        from flask import g

        rid = getattr(g, "request_id", None)
    except RuntimeError:
        rid = None
    if not rid:
        return
    headers = dict(kwargs.get("headers") or {})
    headers.setdefault("X-Request-Id", rid)
    kwargs["headers"] = headers


class RestClient:
    def __init__(self, timeout: int = 10):
        self.timeout = timeout

    def request(self, method: str, url: str, **kwargs):
        _merge_correlation_headers(kwargs)
        response = requests.request(method, url, timeout=self.timeout, **kwargs)
        return response
