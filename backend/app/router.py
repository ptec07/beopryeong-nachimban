from app.schemas import RouteDecision


def _contains_any(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def classify_question(question: str, document_text: str | None = None) -> RouteDecision:
    text = f"{question} {document_text or ''}"
    sub_intents: list[str] = []
    tool_plan: list[str] = []

    if document_text or _contains_any(text, ["계약서", "약관", "처분서", "통지서"]):
        return RouteDecision(
            audience="unknown",
            intent="contract_review",
            subIntents=["law_discovery", "case_search"],
            legalDomain="계약/문서",
            situationType="문서검토",
            urgency="medium",
            needsDocument=True,
            needsClarification=False,
            clarificationQuestions=[],
            toolPlan=["document_review"],
        )

    if _contains_any(text, ["영업정지", "과태료", "과징금", "허가취소", "면허취소"]):
        if _contains_any(text, ["행정심판", "불복", "줄일", "감경", "취소"]):
            sub_intents.append("dispute_prep")
        sub_intents.append("case_search")
        domain = "식품위생" if _contains_any(text, ["음식점", "식품", "위생", "영업정지"]) else "행정처분"
        tool_plan = ["action_basis", "dispute_prep"]
        return RouteDecision(
            audience="small_business",
            intent="penalty_basis",
            subIntents=sub_intents,
            legalDomain=domain,
            situationType="행정처분",
            urgency="medium",
            needsDocument=False,
            needsClarification=True,
            clarificationQuestions=["처분서에 적힌 위반 조항과 위반 횟수를 알 수 있나요?"],
            toolPlan=tool_plan,
        )

    if _contains_any(text, ["전세", "월세", "보증금", "임대차", "권리금", "상가"]):
        if _contains_any(text, ["판례", "사례"]):
            sub_intents.append("case_search")
        return RouteDecision(
            audience="general_user",
            intent="law_discovery",
            subIntents=sub_intents,
            legalDomain="임대차",
            situationType="민사/임대차",
            urgency="medium",
            needsDocument=False,
            needsClarification=True,
            clarificationQuestions=["주거용인지 상가인지, 계약 종료일과 보증금 규모를 알 수 있나요?"],
            toolPlan=["full_research"],
        )

    if _contains_any(text, ["개정", "시행일", "바뀌", "신구"]):
        return RouteDecision(
            audience="unknown",
            intent="amendment_track",
            legalDomain="일반",
            situationType="개정이력",
            urgency="low",
            toolPlan=["amendment_track"],
        )

    if _contains_any(text, ["판례", "사례", "행정심판"]):
        return RouteDecision(
            audience="unknown",
            intent="case_search",
            legalDomain="일반",
            situationType="사례검색",
            urgency="low",
            toolPlan=["case_search"],
        )

    return RouteDecision(
        audience="unknown",
        intent="law_discovery",
        legalDomain="일반",
        situationType="법령탐색",
        urgency="low",
        needsClarification=True,
        clarificationQuestions=["어떤 상황에서 문제가 생겼는지 조금 더 구체적으로 알려주실 수 있나요?"],
        toolPlan=["full_research"],
    )
