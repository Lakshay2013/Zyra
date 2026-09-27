"""Basic Zyra Python SDK tests. Run: python -m pytest  (or: python -m unittest)"""
import os
import unittest

from zyra import Zyra, AsyncZyra, dispatch_log


class TestZyraClient(unittest.TestCase):
    def test_requires_api_key(self):
        os.environ.pop("ZYRA_KEY", None)
        with self.assertRaises(ValueError):
            Zyra()

    def test_returns_openai_client_with_zyra_headers(self):
        client = Zyra(api_key="sk-live-test", base_url="http://localhost:5000")
        # It is a real openai.OpenAI instance pointed at the Zyra gateway
        self.assertTrue(str(client.base_url).rstrip("/").endswith("/v1"))
        self.assertEqual(client.default_headers.get("x-zyra-api-key"), "sk-live-test")

    def test_routing_and_debug_become_headers(self):
        client = Zyra(
            api_key="k",
            debug=True,
            routing={"max_cost": 0.02, "providers": ["openai", "groq"], "mode": "constrained"},
        )
        h = client.default_headers
        self.assertEqual(h.get("x-zyra-debug"), "true")
        self.assertEqual(h.get("x-zyra-max-cost"), "0.02")
        self.assertEqual(h.get("x-zyra-providers"), "openai,groq")
        self.assertEqual(h.get("x-zyra-mode"), "constrained")

    def test_async_client(self):
        client = AsyncZyra(api_key="k")
        self.assertEqual(client.default_headers.get("x-zyra-api-key"), "k")

    def test_env_var_api_key(self):
        os.environ["ZYRA_KEY"] = "sk-live-fromenv"
        try:
            client = Zyra()
            self.assertEqual(client.default_headers.get("x-zyra-api-key"), "sk-live-fromenv")
        finally:
            os.environ.pop("ZYRA_KEY", None)

    def test_dispatch_log_never_raises(self):
        dispatch_log(
            zyra_key="k", sdk_language="python", provider="openai",
            model_requested="gpt-4o-mini", prompt_tokens=1, completion_tokens=1,
            latency_ms=5, status="success",
        )

    def test_explicit_log_never_raises(self):
        from zyra import log
        log(zyra_key="k", user_id="USR001", prompt="hi", response="hello",
            model="gpt-4o", prompt_tokens=1, completion_tokens=1)


if __name__ == "__main__":
    unittest.main()
