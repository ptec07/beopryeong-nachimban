from typing import Protocol

from app.schemas import AnswerSection, LegalResearchResult, Source


class LegalResearchProvider(Protocol):
    async def action_basis(self, query: str) -> LegalResearchResult: ...
    async def dispute_prep(self, query: str) -> LegalResearchResult: ...
    async def full_research(self, query: str) -> LegalResearchResult: ...
    async def document_review(self, text: str) -> LegalResearchResult: ...


class FixtureLegalResearchProvider:
    async def action_basis(self, query: str) -> LegalResearchResult:
        return LegalResearchResult(
            summary="영업정지·과태료 등 행정처분은 위반 내용, 위반 횟수, 시정 여부, 고의성에 따라 기준과 감경 가능성이 달라질 수 있습니다.",
            sections=[
                AnswerSection(title="관련 법령", items=["식품위생법", "식품위생법 시행규칙 별표 행정처분 기준"]),
                AnswerSection(title="적용 기준", items=["1차·2차·3차 위반 여부 확인", "처분서의 위반 조항과 별표 기준 대조", "감경 사유: 즉시 시정, 고의성 부족, 피해 경미성 등 확인"]),
                AnswerSection(title="지금 확인해야 할 사실", items=["처분서에 적힌 위반 조항", "동일 위반 전력", "시정 완료 여부", "매출·생계 영향", "청문 또는 의견제출 기한"]),
            ],
            sources=[
                Source(id="fixture-law-food-1", type="law", title="식품위생법", citation="영업자 준수사항 및 행정처분 관련 조문", confidence="direct"),
                Source(id="fixture-annex-food-1", type="annex", title="식품위생법 시행규칙 별표", citation="행정처분 기준", confidence="direct"),
            ],
        )

    async def dispute_prep(self, query: str) -> LegalResearchResult:
        return LegalResearchResult(
            summary="불복 준비에서는 처분 기준 적용이 정확했는지와 재량권 일탈·남용 사정이 있는지를 확인해야 합니다.",
            sections=[
                AnswerSection(title="관련 사례", items=["행정심판에서는 위반 정도, 시정 노력, 생계 영향이 감경 판단에서 보조적으로 고려될 수 있습니다."]),
                AnswerSection(title="다음 행동", items=["처분서 원문 확인", "의견제출/청문/행정심판 기한 확인", "시정 증빙과 피해 경미성 자료 정리"]),
            ],
            sources=[Source(id="fixture-admin-appeal-1", type="admin_appeal", title="행정심판례 예시", citation="영업정지 감경 관련 유사 사례", confidence="similar")],
        )

    async def full_research(self, query: str) -> LegalResearchResult:
        return LegalResearchResult(
            summary="입력한 상황과 관련된 법령부터 확인하고, 요건·예외·증거를 순서대로 점검하는 것이 좋습니다.",
            sections=[
                AnswerSection(title="관련 법령", items=["주택임대차보호법 또는 상가건물 임대차보호법", "민법상 계약·채무불이행 관련 규정"]),
                AnswerSection(title="지금 확인해야 할 사실", items=["계약 목적물 유형", "계약 기간과 종료 여부", "보증금·차임 규모", "상대방에게 보낸 통지와 증거"]),
            ],
            sources=[
                Source(id="fixture-lease-law-1", type="law", title="임대차 관련 법령", citation="보증금 반환·권리금 보호 관련 조문", confidence="direct"),
                Source(id="fixture-lease-case-1", type="precedent", title="임대차 관련 판례 예시", citation="사실관계별 판단 기준", confidence="supporting"),
            ],
        )

    async def document_review(self, text: str) -> LegalResearchResult:
        return LegalResearchResult(
            summary="문서 검토 beta에서는 불리할 수 있는 조항, 근거 조항, 추가 확인이 필요한 사실을 우선 정리합니다.",
            sections=[
                AnswerSection(title="문서에서 확인할 부분", items=["일방적 해지·위약금 조항", "과도한 손해배상 또는 면책 조항", "관할·분쟁해결 조항", "처분서라면 위반 조항과 불복 기한"]),
                AnswerSection(title="추가로 필요한 사실", items=["계약 체결일", "상대방 유형", "실제 이행 상황", "받은 통지·처분의 날짜"]),
            ],
            sources=[Source(id="fixture-document-1", type="document", title="사용자 제공 문서", citation="붙여넣은 문서 본문 기준 beta 분석", confidence="needs_confirmation")],
        )
