import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "release" / "verificar_hosting.py"
spec = importlib.util.spec_from_file_location("verificar_hosting", SCRIPT)
mod = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(mod)


class HostingVerifierTests(unittest.TestCase):
    def test_extrai_js_css_hashed(self):
        html = '<script type="module" src="/assets/index-B2THAeo8.js"></script><link rel="stylesheet" href="/assets/index-DvYlxBEX.css">'
        self.assertEqual(mod.assets_html(html), {"/assets/index-B2THAeo8.js", "/assets/index-DvYlxBEX.css"})

    def test_tenta_novamente_se_edge_servir_versao_anterior(self):
        expected = {"/assets/new.js"}
        old_html = '<script src="/assets/old.js"></script>'
        new_html = '<script src="/assets/new.js"></script>'
        attempts = []

        def fake_fetch(url, marker):
            attempts.append((url, marker))
            return (old_html if len(attempts) == 1 else new_html, url)

        with patch.object(mod, "obter_html", side_effect=fake_fetch), patch.object(mod.time, "sleep"):
            self.assertTrue(mod.verificar_urls(("https://example.com/",), expected, "build", prazo=120))
        self.assertEqual(len(attempts), 2)

    def test_rejeita_build_diferente_ao_final_do_prazo(self):
        with patch.object(mod, "obter_html", return_value=('<script src="/assets/old.js"></script>', "https://example.com/")):
            self.assertFalse(mod.verificar_urls(("https://example.com/",), {"/assets/new.js"}, "build", prazo=0))


if __name__ == "__main__":
    unittest.main()
