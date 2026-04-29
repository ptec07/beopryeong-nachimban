from uuid import uuid4

from app.providers import LegalResearchProvider
from app.schemas import AnswerSection, AskResponse, RouteDecision

DISCLAIMER = "법령나침반은 법률 자문을 대체하지 않는 법령정보 리서치 도구입니다. 실제 대응은 사실관계와 최신 법령, 관할 기관 판단에 따라 달라질 수 있습니다."


def _followups_for(route: RouteDecision) -> list[str]:
    if route.intent == "penalty_basis":
        return ["처분서 내용을 붙여넣고 분석하기", "감경 사례만 찾아보기", "관련 조문 원문 보기", "행정심판 전 체크리스트 보기"]
    if route.intent == "contract_review":
        return ["문제되는 조항만 다시 정리하기", "수정 제안 문구 만들기", "관련 법령 근거 보기"]
    if route.legalDomain == "임대차":
        return ["계약서 내용을 붙여넣고 분석하기", "권리금 관련 판례 찾기", "보증금 반환 체크리스트 보기"]
    return ["관련 조문 원문 보기", "판례와 행정심판례 찾아보기", "추가 사실을 반영해 다시 검토하기"]


async def build_answer(
    question: str,
    route: RouteDecision,
    provider: LegalResearchProvider,
    document_text: str | None = None,
) -> AskResponse:
    if route.intent == "penalty_basis":
        result = await provider.action_basis(question)
    elif route.intent == "contract_review":
        result = await provider.document_review(document_text or question)
    else:
        result = await provider.full_research(question)

    sections = list(result.sections)
    if route.clarificationQuestions and not any(section.title == "지금 확인해야 할 사실" for section in sections):
        sections.append(AnswerSection(title="지금 확인해야 할 사실", items=route.clarificationQuestions))

    return AskResponse(
        answerId=str(uuid4()),
        route=route,
        summary=result.summary,
        sections=sections,
        sources=result.sources,
        followUps=_followups_for(route),
        disclaimer=DISCLAIMER,
    )
