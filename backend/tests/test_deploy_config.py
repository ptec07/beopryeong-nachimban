import json
from pathlib import Path

from app.main import get_allowed_origins


def test_get_allowed_origins_includes_render_frontend_origin_from_env(monkeypatch):
    monkeypatch.setenv("FRONTEND_ORIGIN", "https://beopryeong-nachimban.vercel.app")

    assert "https://beopryeong-nachimban.vercel.app" in get_allowed_origins()


def test_vercel_frontend_config_exists_for_spa_deploy():
    project_root = Path(__file__).resolve().parents[2]
    vercel_config = project_root / "frontend" / "vercel.json"

    payload = json.loads(vercel_config.read_text(encoding="utf-8"))
    assert payload["version"] == 2
    assert payload["outputDirectory"] == "dist"
    assert {"source": "/(.*)", "destination": "/index.html"} in payload["rewrites"]
