from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_api_ask_returns_route_and_sources():
    response = client.post("/api/ask", json={"question": "음식점 영업정지 줄일 수 있어?", "mode": "auto"})
    assert response.status_code == 200
    data = response.json()
    assert data["route"]["intent"] == "penalty_basis"
    assert data["sources"]
    assert data["followUps"]


def test_api_ask_rejects_empty_question():
    response = client.post("/api/ask", json={"question": "", "mode": "auto"})
    assert response.status_code == 422
