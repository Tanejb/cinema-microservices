from __future__ import annotations

import requests


class RestClient:
    def __init__(self, timeout: int = 10):
        self.timeout = timeout

    def request(self, method: str, url: str, **kwargs):
        response = requests.request(method, url, timeout=self.timeout, **kwargs)
        return response
