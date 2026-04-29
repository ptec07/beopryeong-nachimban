import pytest

from app.answer_builder import build_answer
from app.providers import FixtureLegalResearchProvider
from app.router import classify_question


@pytest.mark.asyncio
async def test_build_answer_for_penalty_question_contains_required_sections():
    route = classify_question("음식점 영업정지 2개월 처분을 받았는데 줄일 수 있나요?")
    response = await build_answer(
        question="음식점 영업정지 2개월 처분을 받았는데 줄일 수 있나요?",
        route=route,
        provider=FixtureLegalResearchProvider(),
    )
    titles = [section.title for section in response.sections]
    assert "관련 법령" in titles
    assert "지금 확인해야 할 사실" in titles
    assert response.sources
    assert "법률 자문을 대체하지" in response.disclaimer
