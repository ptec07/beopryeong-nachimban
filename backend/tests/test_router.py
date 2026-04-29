from app.router import classify_question


def test_classifies_food_business_suspension_as_penalty_basis():
    route = classify_question("음식점 영업정지 2개월 처분을 받았는데 줄일 수 있나요?")
    assert route.audience == "small_business"
    assert route.intent == "penalty_basis"
    assert "dispute_prep" in route.subIntents
    assert route.legalDomain == "식품위생"


def test_classifies_lease_deposit_as_law_discovery():
    route = classify_question("전세보증금을 못 돌려받고 있어요")
    assert route.audience == "general_user"
    assert route.intent == "law_discovery"
    assert route.legalDomain == "임대차"


def test_classifies_contract_text_as_contract_review():
    route = classify_question("이 계약서 위험한 조항 봐줘", document_text="제1조 ...")
    assert route.intent == "contract_review"
    assert route.needsDocument is True
