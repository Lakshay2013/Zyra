"""
OpenAI-compatible Zyra clients.

The package keeps OpenAI optional. Importing zyra works without extra
dependencies; constructing a client requires the relevant provider SDK.
"""

import os
from typing import Any, Dict, Optional


def _headers(api_key: str, debug: bool = False, routing: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
    routing = routing or {}
    headers = {"x-zyra-api-key": api_key}
    if debug:
        headers["x-zyra-debug"] = "true"
    if routing.get("max_cost") is not None:
        headers["x-zyra-max-cost"] = str(routing["max_cost"])
    if routing.get("providers"):
        headers["x-zyra-providers"] = ",".join(routing["providers"])
    if routing.get("mode"):
        headers["x-zyra-mode"] = str(routing["mode"])
    return headers


def _load_openai():
    try:
        import openai  # type: ignore
    except ImportError as exc:
        raise ImportError("Zyra requires the optional openai package: pip install 'zyra[openai]'") from exc
    return openai


class Zyra:
    """Drop-in wrapper around openai.OpenAI routed through Zyra."""

    def __new__(
        cls,
        *,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        debug: bool = False,
        routing: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ):
        zyra_key = api_key or os.environ.get("ZYRA_KEY")
        if not zyra_key:
            raise ValueError("Zyra api_key is required")

        openai = _load_openai()
        default_headers = dict(kwargs.pop("default_headers", {}) or {})
        default_headers.update(_headers(zyra_key, debug, routing))

        return openai.OpenAI(
            api_key="zyra-passthrough",
            base_url=base_url or os.environ.get("ZYRA_API_URL", "http://localhost:5000").rstrip("/") + "/v1",
            default_headers=default_headers,
            **kwargs,
        )


class AsyncZyra:
    """Async drop-in wrapper around openai.AsyncOpenAI routed through Zyra."""

    def __new__(
        cls,
        *,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        debug: bool = False,
        routing: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ):
        zyra_key = api_key or os.environ.get("ZYRA_KEY")
        if not zyra_key:
            raise ValueError("Zyra api_key is required")

        openai = _load_openai()
        default_headers = dict(kwargs.pop("default_headers", {}) or {})
        default_headers.update(_headers(zyra_key, debug, routing))

        return openai.AsyncOpenAI(
            api_key="zyra-passthrough",
            base_url=base_url or os.environ.get("ZYRA_API_URL", "http://localhost:5000").rstrip("/") + "/v1",
            default_headers=default_headers,
            **kwargs,
        )
