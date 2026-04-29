import pytest

from app.providers import FixtureLegalResearchProvider


@pytest.mark.asyncio
async def test_action_basis_returns_sources():
    provider = FixtureLegalResearchProvider()
    result = await provider.action_basis("음식점 영업정지")
    assert result.sources
    assert any(source.type == "law" for source in result.sources)


@pytest.mark.asyncio
async def test_document_review_returns_contract_review_section():
    provider = FixtureLegalResearchProvider()
    result = await provider.document_review("계약서 본문")
    assert any(section.title == "문서에서 확인할 부분" for section in result.sections)
