"""
Zyra Python SDK — Fire-and-forget log dispatcher.

Always non-blocking. Uses a background thread so it never adds latency
to the LLM call. Gracefully swallows all errors.

Respects:
    ZYRA_DISABLE=true  — disables all logging
    ZYRA_KEY           — Zyra API key (falls back to zyra_key argument)
    ZYRA_API_URL       — override API endpoint (default: https://api.zyra.dev)
"""

import os
import json
import threading
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Optional

_ZYRA_API_URL = os.environ.get("ZYRA_API_URL", "https://api.zyra.dev")
_LOG_ENDPOINT = f"{_ZYRA_API_URL.rstrip('/')}/v1/log"
_LOG_TIMEOUT = 5  # seconds


def dispatch_log(
    *,
    zyra_key: Optional[str] = None,
    sdk_language: str = "python",
    provider: str = "openai",
    model_requested: str = "unknown",
    model_routed_to: Optional[str] = None,
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    latency_ms: int = 0,
    cost_usd: Optional[float] = None,
    status: str = "success",
    error_message: Optional[str] = None,
) -> None:
    """
    Dispatch a log entry to Zyra. Non-blocking — returns immediately.
    All errors are silently swallowed to protect the user's LLM call.

    Args:
        zyra_key:          Zyra API key (falls back to ZYRA_KEY env var)
        sdk_language:      'python' | 'node' | 'go' | 'proxy' | etc.
        provider:          'openai' | 'anthropic' | 'groq' | 'gemini' | ...
        model_requested:   Model the user specified (e.g. 'gpt-4o')
        model_routed_to:   Model actually used (may differ after routing)
        prompt_tokens:     Input token count
        completion_tokens: Output token count
        latency_ms:        End-to-end latency in milliseconds
        cost_usd:          Cost in USD (Zyra will estimate if None)
        status:            'success' | 'error'
        error_message:     Error message if status == 'error'
    """
    if os.environ.get("ZYRA_DISABLE") == "true":
        return

    key = zyra_key or os.environ.get("ZYRA_KEY", "")
    if not key:
        return

    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sdk_language": sdk_language,
        "provider": provider,
        "model_requested": model_requested,
        "model_routed_to": model_routed_to or model_requested,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "latency_ms": latency_ms,
        "cost_usd": cost_usd,
        "status": status,
        "error_message": error_message,
    }

    # Fire-and-forget via daemon thread — never blocks the caller
    t = threading.Thread(target=_send, args=(key, payload), daemon=True)
    t.start()


def _send(key: str, payload: dict) -> None:
    """Internal: performs the HTTP POST. Must not raise."""
    try:
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            _LOG_ENDPOINT,
            data=body,
            headers={
                "Content-Type": "application/json",
                "x-zyra-api-key": key,
                "User-Agent": "zyra-sdk-python/0.2.0",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=_LOG_TIMEOUT):
            pass  # We only care that it was accepted (202)
    except Exception:
        pass  # Silently swallow — never surface to user
