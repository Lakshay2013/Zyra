"""
Zyra Python SDK

Drop-in replacement for openai.OpenAI and anthropic.Anthropic with
automatic cost logging to the Zyra dashboard.

Quick start:
    from zyra import Zyra
    client = Zyra(api_key="sk-...")  # same as openai.OpenAI
    res = client.chat.completions.create(model="auto", messages=[...])

Zero-code auto-patch (patches all clients globally):
    import zyra
    zyra.auto_patch()
"""

from zyra.client import Zyra, AsyncZyra
from zyra.logger import dispatch_log

__version__ = "0.2.0"
__all__ = ["Zyra", "AsyncZyra", "dispatch_log", "auto_patch"]


def auto_patch():
    """
    Globally monkey-patch openai.OpenAI and anthropic.Anthropic so all
    calls are automatically logged to Zyra. Call once at process start.

    Requires ZYRA_KEY env variable.

    Example:
        import zyra
        zyra.auto_patch()  # one line — all LLM calls logged from here on
    """
    from zyra._autopatch import apply_patches
    apply_patches()
