"""Runtime auto-patching for supported Python LLM SDKs."""

import os
import time
from typing import Any, Callable

from zyra.logger import dispatch_log


def _wrap_create(original: Callable[..., Any], provider: str) -> Callable[..., Any]:
    def wrapped(*args: Any, **kwargs: Any) -> Any:
        if os.environ.get("ZYRA_DISABLE") == "true":
            return original(*args, **kwargs)

        params = kwargs if kwargs else (args[0] if args and isinstance(args[0], dict) else {})
        model_requested = params.get("model", "unknown") if isinstance(params, dict) else "unknown"
        start = time.time()
        status = "success"
        error_message = None
        result = None

        try:
            result = original(*args, **kwargs)
            return result
        except Exception as exc:
            status = "error"
            error_message = str(exc)
            raise
        finally:
            usage = getattr(result, "usage", None)
            prompt_tokens = (
                getattr(usage, "prompt_tokens", None)
                or getattr(usage, "input_tokens", None)
                or 0
            )
            completion_tokens = (
                getattr(usage, "completion_tokens", None)
                or getattr(usage, "output_tokens", None)
                or 0
            )
            dispatch_log(
                sdk_language="python",
                provider=provider,
                model_requested=model_requested,
                model_routed_to=getattr(result, "model", model_requested) if result is not None else model_requested,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                latency_ms=int((time.time() - start) * 1000),
                status=status,
                error_message=error_message,
            )

    return wrapped


def _patch_openai() -> None:
    try:
        import openai  # type: ignore
    except ImportError:
        return

    for cls_name in ("OpenAI", "AsyncOpenAI"):
        cls = getattr(openai, cls_name, None)
        if not cls or getattr(cls, "_zyra_patched", False):
            continue

        original_init = cls.__init__

        def patched_init(self: Any, *args: Any, _original_init: Callable[..., Any] = original_init, **kwargs: Any) -> None:
            _original_init(self, *args, **kwargs)
            create = getattr(getattr(self.chat, "completions", None), "create", None)
            if create and not getattr(create, "_zyra_patched", False):
                wrapped = _wrap_create(create, "openai")
                setattr(wrapped, "_zyra_patched", True)
                self.chat.completions.create = wrapped

        cls.__init__ = patched_init
        cls._zyra_patched = True


def _patch_anthropic() -> None:
    try:
        import anthropic  # type: ignore
    except ImportError:
        return

    for cls_name in ("Anthropic", "AsyncAnthropic"):
        cls = getattr(anthropic, cls_name, None)
        if not cls or getattr(cls, "_zyra_patched", False):
            continue

        original_init = cls.__init__

        def patched_init(self: Any, *args: Any, _original_init: Callable[..., Any] = original_init, **kwargs: Any) -> None:
            _original_init(self, *args, **kwargs)
            create = getattr(getattr(self, "messages", None), "create", None)
            if create and not getattr(create, "_zyra_patched", False):
                wrapped = _wrap_create(create, "anthropic")
                setattr(wrapped, "_zyra_patched", True)
                self.messages.create = wrapped

        cls.__init__ = patched_init
        cls._zyra_patched = True


def apply_patches() -> None:
    """Patch installed OpenAI and Anthropic clients if available."""
    _patch_openai()
    _patch_anthropic()
