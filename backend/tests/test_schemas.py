from app.schemas import AskRequest, AskResponse


def test_ask_request_accepts_auto_mode():
    req = AskRequest(question="영업정지 2개월 줄일 수 있어?", mode="auto")
    assert req.question == "영업정지 2개월 줄일 수 있어?"
    assert req.mode == "auto"


def test_ask_response_contains_sources_and_followups():
    payload = {
        "answerId": "test-id",
        "route": {
            "audience": "small_business",
            "intent": "penalty_basis",
            "subIntents": ["dispute_prep"],
            "legalDomain": "식품위생",
            "situationType": "행정처분",
            "urgency": "medium",
            "needsDocument": False,
            "needsClarification": True,
            "clarificationQuestions": ["위반 횟수를 알 수 있나요?"],
            "toolPlan": ["action_basis"],
        },
        "summary": "감경 가능성이 있을 수 있습니다.",
        "sections": [{"title": "관련 법령", "items": ["식품위생법"]}],
        "sources": [
            {
                "id": "s1",
                "type": "law",
                "title": "식품위생법",
                "citation": "관련 조문",
                "url": None,
                "confidence": "direct",
            }
        ],
        "followUps": ["처분서 분석하기"],
        "disclaimer": "법률 자문을 대체하지 않습니다.",
    }
    response = AskResponse(**payload)
    assert response.route.intent == "penalty_basis"
    assert response.sources[0].confidence == "direct"
