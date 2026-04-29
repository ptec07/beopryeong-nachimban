# 법령나침반 MVP Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 일반인과 소상공인/자영업자가 법령명을 몰라도 자신의 상황을 자연어로 입력하면 관련 법령·처분기준·판례·행정심판례를 근거와 함께 정리받는 웹앱 MVP를 만든다.

**Architecture:** 겉으로는 단일 자연어 입력창을 제공하고, 백엔드는 질문을 반구조화 라우트로 분류한 뒤 법령정보 MCP/API 도구 결과를 수집해 근거 기반 답변 카드로 반환한다. MVP는 실제 법령정보 연동 전에도 테스트 가능한 `LegalResearchProvider` 인터페이스와 fixture-backed fake provider를 먼저 만들고, 이후 MCP/API 어댑터를 붙일 수 있게 경계를 분리한다.

**Tech Stack:** FastAPI backend, Pydantic schemas, pytest, React/Vite/TypeScript frontend, Vitest/React Testing Library, optional Tailwind or plain CSS. 배포는 GitHub-first 흐름을 전제로 하되, 첫 계획은 로컬 MVP 완성까지로 제한한다.

---

## 0. Product Scope

### Product name

**법령나침반**

### Positioning

> 법령명을 몰라도 내 상황을 입력하면 관련 법령, 처분기준, 판례, 행정심판례를 근거와 함께 찾아주는 자연어 법령 리서치 도우미.

### Primary audiences

1. **일반인**
   - 임대차/전세/보증금
   - 해고/임금/퇴직금
   - 개인정보 유출
   - 소비자/중고거래 문제
   - 신고·불복 절차

2. **소상공인/자영업자**
   - 영업정지/과태료/과징금
   - 상가임대차/권리금
   - 직원 고용/해고
   - 식품위생/표시광고/개인정보
   - 계약서/처분서 해석

### MVP domain focus

1. 행정처분 대응: 영업정지, 과태료, 과징금, 면허취소
2. 임대차/상가 권리금
3. 계약서/처분서 붙여넣기 분석은 beta-level UI와 backend route만 제공

### Non-goals for MVP

- 회원가입/결제
- 변호사 매칭
- 사건 관리 SaaS
- 문서 자동작성 전체 기능
- 대규모 전국 조례 비교
- 조약/영문법령
- PDF 업로드
- 모바일 앱
- 커뮤니티
- 관리자 대시보드

---

## 1. User Experience

### Home page copy

```text
법령명을 몰라도 괜찮습니다.
내 상황을 입력하면 관련 법령과 근거를 찾아드립니다.
```

### Input placeholder

```text
예: 음식점 영업정지 2개월 처분을 받았는데 줄일 수 있나요?
```

### Quick topic buttons

- 영업정지/과태료
- 임대차/전세
- 상가 권리금
- 계약서 검토
- 노동/해고
- 개인정보
- 판례 찾기

### Result sections

1. 한 줄 결론
2. 관련 법령
3. 적용 기준
4. 관련 판례/행정심판례
5. 지금 확인해야 할 사실
6. 가능한 다음 행동
7. 원문 근거
8. 후속 질문

### Legal safety copy

```text
법령나침반은 법률 자문을 대체하지 않는 법령정보 리서치 도구입니다. 실제 대응은 사실관계와 최신 법령, 관할 기관 판단에 따라 달라질 수 있습니다.
```

---

## 2. Backend Design

### Main endpoint

`POST /api/ask`

Request:

```json
{
  "question": "음식점 영업정지 2개월 처분을 받았는데 줄일 수 있나요?",
  "mode": "auto",
  "documentText": null
}
```

Response:

```json
{
  "answerId": "uuid",
  "route": {
    "audience": "small_business",
    "intent": "penalty_basis",
    "subIntents": ["dispute_prep", "case_search"],
    "legalDomain": "식품위생",
    "situationType": "행정처분",
    "urgency": "medium",
    "needsDocument": false,
    "needsClarification": true,
    "clarificationQuestions": [
      "처분서에 적힌 위반 조항과 위반 횟수를 알 수 있나요?"
    ],
    "toolPlan": ["action_basis", "dispute_prep"]
  },
  "summary": "영업정지 기간은 위반 내용, 위반 횟수, 고의성, 시정 여부에 따라 감경 가능성이 있을 수 있습니다.",
  "sections": [
    {
      "title": "관련 법령",
      "items": ["식품위생법", "식품위생법 시행규칙 별표 행정처분 기준"]
    }
  ],
  "sources": [
    {
      "id": "source-1",
      "type": "law",
      "title": "식품위생법",
      "citation": "식품위생법 관련 조문",
      "url": null,
      "confidence": "direct"
    }
  ],
  "followUps": [
    "처분서 내용을 붙여넣고 분석하기",
    "감경 사례만 찾아보기",
    "관련 조문 원문 보기"
  ],
  "disclaimer": "법령나침반은 법률 자문을 대체하지 않는 법령정보 리서치 도구입니다."
}
```

### Route enum

```text
law_discovery       적용 법령 찾기
article_lookup      특정 조문 조회
penalty_basis       영업정지·과태료·과징금 기준
dispute_prep        불복·행정심판 준비
case_search         판례·결정례 검색
contract_review     계약서·처분서 분석
procedure_detail    신고·허가·수수료·서식
amendment_track     개정이력·시행일
```

### Provider boundary

Create an interface so the app can run with fake fixtures first:

```python
class LegalResearchProvider(Protocol):
    async def action_basis(self, query: str) -> LegalResearchResult: ...
    async def dispute_prep(self, query: str) -> LegalResearchResult: ...
    async def full_research(self, query: str) -> LegalResearchResult: ...
    async def document_review(self, text: str) -> LegalResearchResult: ...
```

MVP starts with `FixtureLegalResearchProvider`, then adds `McpLegalResearchProvider` later.

---

## 3. File Layout

```text
beopryeong-nachimban/
  README.md
  .gitignore
  backend/
    pyproject.toml
    app/
      __init__.py
      main.py
      schemas.py
      router.py
      answer_builder.py
      providers.py
      fixtures.py
    tests/
      test_router.py
      test_api_ask.py
      test_answer_builder.py
  frontend/
    package.json
    index.html
    src/
      main.tsx
      App.tsx
      api.ts
      types.ts
      components/
        QuestionForm.tsx
        QuickTopics.tsx
        ResultView.tsx
        SourceList.tsx
      __tests__/
        router-ui.test.tsx
        result-view.test.tsx
  docs/
    plans/
      2026-04-29-mvp-design-and-implementation-plan.md
```

---

## 4. Implementation Tasks

### Task 1: Create project skeleton safely

**Objective:** Create the app folder and minimal backend/frontend directories without overwriting existing files.

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create directories under `backend/`, `frontend/`, `docs/`

**Step 1: Verify target path**

Run:

```bash
test ! -e /home/ptec07/.hermes/hermes-agent/workforce/beopryeong-nachimban
```

Expected: if this fails, stop and choose a sibling path such as `beopryeong-nachimban-v2` unless the user explicitly approves reuse.

**Step 2: Create folders**

```bash
mkdir -p backend/app backend/tests frontend/src/components frontend/src/__tests__ docs/plans
```

**Step 3: Add `.gitignore`**

```gitignore
# Python
.venv/
__pycache__/
*.pyc
.pytest_cache/
*.egg-info/

# Node
node_modules/
dist/
coverage/

# Env
.env
.env.*
!.env.example

# OS/editor
.DS_Store
.vscode/
.idea/
```

**Step 4: Add README**

```markdown
# 법령나침반

법령명을 몰라도 내 상황을 입력하면 관련 법령, 처분기준, 판례, 행정심판례를 근거와 함께 찾아주는 자연어 법령 리서치 웹앱입니다.

## MVP scope

- 자연어 질문 입력
- 반구조화 질문 라우팅
- 근거 기반 답변 카드
- 행정처분/임대차/계약서 beta 흐름
- fixture-backed backend for TDD before real legal data integration
```

**Step 5: Initialize git**

```bash
git init
git add README.md .gitignore docs/plans/2026-04-29-mvp-design-and-implementation-plan.md
git commit -m "docs: add legal compass MVP plan"
```

Expected: initial commit succeeds.

---

### Task 2: Define backend schemas with failing tests

**Objective:** Add Pydantic models for the ask request, route decision, answer sections, and sources.

**Files:**
- Create: `backend/app/schemas.py`
- Test: `backend/tests/test_schemas.py`

**Step 1: Write failing test**

```python
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
            "toolPlan": ["action_basis"]
        },
        "summary": "감경 가능성이 있을 수 있습니다.",
        "sections": [{"title": "관련 법령", "items": ["식품위생법"]}],
        "sources": [{"id": "s1", "type": "law", "title": "식품위생법", "citation": "관련 조문", "url": None, "confidence": "direct"}],
        "followUps": ["처분서 분석하기"],
        "disclaimer": "법률 자문을 대체하지 않습니다."
    }
    response = AskResponse(**payload)
    assert response.route.intent == "penalty_basis"
    assert response.sources[0].confidence == "direct"
```

**Step 2: Run and verify failure**

```bash
cd backend
pytest tests/test_schemas.py -v
```

Expected: FAIL because `app.schemas` does not exist.

**Step 3: Implement schemas**

Use Pydantic models with Literal enums for `mode`, `audience`, `intent`, `urgency`, `source.type`, and `source.confidence`.

**Step 4: Run test and verify pass**

```bash
cd backend
pytest tests/test_schemas.py -v
```

Expected: PASS.

---

### Task 3: Implement deterministic question router

**Objective:** Classify common Korean natural-language legal questions into MVP routes with deterministic keyword rules before introducing LLM routing.

**Files:**
- Create: `backend/app/router.py`
- Test: `backend/tests/test_router.py`

**Step 1: Write failing tests**

```python
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
```

**Step 2: Run and verify failure**

```bash
cd backend
pytest tests/test_router.py -v
```

Expected: FAIL because router does not exist.

**Step 3: Implement router**

Rules:

- `영업정지`, `과태료`, `과징금`, `허가취소`, `면허취소` → `penalty_basis`
- `전세`, `월세`, `보증금`, `임대차`, `권리금` → `law_discovery`, domain `임대차`
- `계약서`, `약관`, `처분서`, `통지서` or `documentText` present → `contract_review`
- `판례`, `사례`, `행정심판` → `case_search` or secondary `case_search`
- `개정`, `시행일`, `바뀌` → `amendment_track`
- fallback → `law_discovery`

**Step 4: Run and verify pass**

```bash
cd backend
pytest tests/test_router.py -v
```

Expected: PASS.

---

### Task 4: Add fixture-backed legal research provider

**Objective:** Return stable fake legal research results for tests and local demo before real MCP/API integration.

**Files:**
- Create: `backend/app/providers.py`
- Create: `backend/app/fixtures.py`
- Test: `backend/tests/test_provider.py`

**Step 1: Write failing tests**

```python
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
```

**Step 2: Run and verify failure**

```bash
cd backend
pytest tests/test_provider.py -v
```

Expected: FAIL because provider does not exist.

**Step 3: Implement provider**

Implement fixture result objects using existing schemas:

- action_basis: 식품위생법/시행규칙 별표 placeholder sources
- dispute_prep: 행정심판례 placeholder source
- full_research: 임대차/권리금 placeholder sources
- document_review: 문서 검토 beta placeholder sections

Mark fixture sources with clear titles and no fake URLs if real URLs are unavailable.

**Step 4: Run and verify pass**

```bash
cd backend
pytest tests/test_provider.py -v
```

Expected: PASS.

---

### Task 5: Build answer builder

**Objective:** Combine route decisions and provider results into a user-facing answer response.

**Files:**
- Create: `backend/app/answer_builder.py`
- Test: `backend/tests/test_answer_builder.py`

**Step 1: Write failing test**

```python
import pytest
from app.answer_builder import build_answer
from app.router import classify_question
from app.providers import FixtureLegalResearchProvider


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
```

**Step 2: Run and verify failure**

```bash
cd backend
pytest tests/test_answer_builder.py -v
```

Expected: FAIL because answer builder does not exist.

**Step 3: Implement answer builder**

Map route to provider method:

- `penalty_basis` → `action_basis`, and append dispute/case follow-ups
- `contract_review` → `document_review`
- default → `full_research`

Always include:

- summary
- sections
- sources
- followUps
- disclaimer

**Step 4: Run and verify pass**

```bash
cd backend
pytest tests/test_answer_builder.py -v
```

Expected: PASS.

---

### Task 6: Add FastAPI `/api/ask`

**Objective:** Expose the backend ask flow as a JSON API.

**Files:**
- Create: `backend/app/main.py`
- Test: `backend/tests/test_api_ask.py`

**Step 1: Write failing test**

```python
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
```

**Step 2: Run and verify failure**

```bash
cd backend
pytest tests/test_api_ask.py -v
```

Expected: FAIL because FastAPI app does not exist.

**Step 3: Implement API**

- Create `FastAPI(title="법령나침반")`
- Add CORS for local frontend dev
- Add `POST /api/ask`
- Use `classify_question()` and `build_answer()`

**Step 4: Run and verify pass**

```bash
cd backend
pytest tests/test_api_ask.py -v
```

Expected: PASS.

---

### Task 7: Scaffold frontend with tests

**Objective:** Create a minimal Vite React frontend with typed API models.

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/src/types.ts`
- Create: `frontend/src/api.ts`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`

**Step 1: Create package config**

Use scripts:

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "test": "vitest run"
  }
}
```

Dependencies:

- `@vitejs/plugin-react`
- `vite`
- `typescript`
- `react`
- `react-dom`
- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `jsdom`

**Step 2: Add types matching backend response**

Create `AskRequest`, `AskResponse`, `RouteDecision`, `AnswerSection`, `Source`.

**Step 3: Add API client**

`askLegalCompass(request: AskRequest): Promise<AskResponse>` posts to `/api/ask`.

**Step 4: Add minimal App shell**

Render title, input form, quick topics, and empty result placeholder.

**Step 5: Run build**

```bash
cd frontend
npm install
npm run build
```

Expected: build succeeds.

---

### Task 8: Build question form and quick topics with tests

**Objective:** Let users type a question or click a quick topic.

**Files:**
- Create: `frontend/src/components/QuestionForm.tsx`
- Create: `frontend/src/components/QuickTopics.tsx`
- Test: `frontend/src/__tests__/question-form.test.tsx`

**Step 1: Write failing UI test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuestionForm } from '../components/QuestionForm';


describe('QuestionForm', () => {
  it('submits typed question', () => {
    const onSubmit = vi.fn();
    render(<QuestionForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('질문'), { target: { value: '영업정지 줄일 수 있어?' } });
    fireEvent.click(screen.getByText('근거 찾기'));
    expect(onSubmit).toHaveBeenCalledWith('영업정지 줄일 수 있어?');
  });
});
```

**Step 2: Run and verify failure**

```bash
cd frontend
npm test -- question-form
```

Expected: FAIL because component does not exist.

**Step 3: Implement components**

- `QuestionForm` with accessible label `질문`
- Submit button `근거 찾기`
- `QuickTopics` buttons for MVP categories

**Step 4: Run and verify pass**

```bash
cd frontend
npm test -- question-form
```

Expected: PASS.

---

### Task 9: Build result view with tests

**Objective:** Render summary, sections, sources, follow-ups, and disclaimer clearly.

**Files:**
- Create: `frontend/src/components/ResultView.tsx`
- Create: `frontend/src/components/SourceList.tsx`
- Test: `frontend/src/__tests__/result-view.test.tsx`

**Step 1: Write failing UI test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResultView } from '../components/ResultView';


describe('ResultView', () => {
  it('renders summary, sections, sources, and disclaimer', () => {
    render(<ResultView result={{
      answerId: 'id',
      route: {
        audience: 'small_business', intent: 'penalty_basis', subIntents: [], legalDomain: '식품위생',
        situationType: '행정처분', urgency: 'medium', needsDocument: false, needsClarification: true,
        clarificationQuestions: [], toolPlan: []
      },
      summary: '감경 가능성이 있을 수 있습니다.',
      sections: [{ title: '관련 법령', items: ['식품위생법'] }],
      sources: [{ id: 's1', type: 'law', title: '식품위생법', citation: '관련 조문', url: null, confidence: 'direct' }],
      followUps: ['처분서 분석하기'],
      disclaimer: '법률 자문을 대체하지 않습니다.'
    }} />);
    expect(screen.getByText('감경 가능성이 있을 수 있습니다.')).toBeInTheDocument();
    expect(screen.getByText('관련 법령')).toBeInTheDocument();
    expect(screen.getByText('식품위생법')).toBeInTheDocument();
    expect(screen.getByText('법률 자문을 대체하지 않습니다.')).toBeInTheDocument();
  });
});
```

**Step 2: Run and verify failure**

```bash
cd frontend
npm test -- result-view
```

Expected: FAIL because component does not exist.

**Step 3: Implement result components**

Use card-like sections:

- summary panel
- route badge
- section list
- source list
- follow-up chips
- disclaimer alert

**Step 4: Run and verify pass**

```bash
cd frontend
npm test -- result-view
```

Expected: PASS.

---

### Task 10: Wire frontend to backend

**Objective:** Submit questions from the UI, call `/api/ask`, and render results with loading/error states.

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/api.ts`
- Test: `frontend/src/__tests__/app-flow.test.tsx`

**Step 1: Write failing integration-style UI test**

Mock `global.fetch`, submit a question, and assert the returned summary appears.

**Step 2: Run and verify failure**

```bash
cd frontend
npm test -- app-flow
```

Expected: FAIL until App wiring is implemented.

**Step 3: Implement App state**

States:

- `idle`
- `loading`
- `success`
- `error`

**Step 4: Run and verify pass**

```bash
cd frontend
npm test -- app-flow
```

Expected: PASS.

---

### Task 11: Add local development commands and verification

**Objective:** Make it easy to run both apps locally.

**Files:**
- Modify: `README.md`
- Create: `backend/pyproject.toml`
- Optional Create: `Makefile`

**Step 1: Backend setup command**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
pytest -v
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Step 2: Frontend setup command**

```bash
cd frontend
npm install
npm run dev
```

**Step 3: Verify API manually**

```bash
curl -s http://localhost:8000/api/ask \
  -H 'Content-Type: application/json' \
  -d '{"question":"음식점 영업정지 줄일 수 있어?","mode":"auto"}'
```

Expected: JSON with `route.intent = penalty_basis` and at least one source.

---

### Task 12: Add real legal data adapter placeholder

**Objective:** Prepare for MCP/API legal information integration without blocking MVP tests.

**Files:**
- Modify: `backend/app/providers.py`
- Test: `backend/tests/test_provider_selection.py`

**Step 1: Write failing test**

Test that `get_provider()` returns fixture provider by default and leaves room for a real provider when `LEGAL_PROVIDER=mcp`.

**Step 2: Implement provider factory**

```python
def get_provider() -> LegalResearchProvider:
    provider_name = os.getenv("LEGAL_PROVIDER", "fixture")
    if provider_name == "fixture":
        return FixtureLegalResearchProvider()
    if provider_name == "mcp":
        return McpLegalResearchProvider()
    raise ValueError(f"Unsupported LEGAL_PROVIDER: {provider_name}")
```

For MVP, `McpLegalResearchProvider` may raise `NotImplementedError` with a clear message, or call an internal adapter if the runtime supports Hermes MCP tool bridging.

**Step 3: Run tests**

```bash
cd backend
pytest -v
```

Expected: all backend tests pass.

---

## 5. Real Legal Data Integration Plan

After fixture MVP passes:

### Tool mapping

| App route | Legal data action |
|---|---|
| `law_discovery` | full research chain / law search |
| `article_lookup` | search law → get law text |
| `penalty_basis` | action basis chain, scenario penalty |
| `dispute_prep` | dispute prep chain |
| `case_search` | search decisions + get decision text |
| `contract_review` | document review chain |
| `procedure_detail` | procedure detail chain |
| `amendment_track` | amendment track chain |

### Grounding rule

Every generated answer must separate:

- 직접 근거: 법령, 시행령, 시행규칙, 별표
- 보조 근거: 판례, 행정심판례, 해석례
- 유사 사례: 사실관계가 다른 사례
- 추가 확인 필요: 사용자 사실관계가 필요한 부분

### Citation verification

Before returning final answers that mention exact articles, run citation verification where available.

---

## 6. Acceptance Criteria

### Backend

- `POST /api/ask` accepts Korean natural-language questions.
- Food business suspension questions route to `penalty_basis`.
- Lease/deposit questions route to `law_discovery` with `임대차` domain.
- Contract/document questions route to `contract_review`.
- Every response includes summary, route, sections, sources, follow-ups, and disclaimer.
- Backend tests pass with `pytest -v`.

### Frontend

- User can type a question and submit it.
- User can click quick topic buttons.
- Loading and error states are visible.
- Result view renders summary, sections, sources, follow-ups, disclaimer.
- Frontend tests pass with `npm test`.
- Build passes with `npm run build`.

### Product

- Copy does not claim to replace a lawyer.
- UI emphasizes sources and factual follow-up questions.
- MVP stays focused on general users + small business owners.

---

## 7. Suggested Commit Sequence

1. `docs: add legal compass MVP plan`
2. `chore: scaffold legal compass project`
3. `test: add backend schema tests`
4. `feat: add backend schemas`
5. `test: add deterministic router tests`
6. `feat: add deterministic legal question router`
7. `feat: add fixture legal research provider`
8. `feat: add grounded answer builder`
9. `feat: expose ask API`
10. `chore: scaffold React frontend`
11. `feat: add question form and quick topics`
12. `feat: add result view`
13. `feat: wire frontend ask flow`
14. `docs: add local development guide`

---

## 8. Open Decisions

These do not block the fixture MVP:

1. Real backend legal-data integration path:
   - direct MCP bridge from backend,
   - separate Hermes-mediated service,
   - or public API credentials in backend.
2. Deployment target:
   - Vercel frontend + Render backend,
   - all-in-one Render app,
   - or static frontend with serverless API.
3. Whether to store user questions/history.
   - MVP recommendation: do not store by default.
4. Whether to support uploaded files.
   - MVP recommendation: pasted text only.

---

## 9. Verification Commands

Backend:

```bash
cd backend
pytest -v
```

Frontend:

```bash
cd frontend
npm test
npm run build
```

Manual API smoke test:

```bash
curl -s http://localhost:8000/api/ask \
  -H 'Content-Type: application/json' \
  -d '{"question":"음식점 영업정지 줄일 수 있어?","mode":"auto"}' | python -m json.tool
```

Manual UI smoke test:

1. Start backend on port 8000.
2. Start frontend dev server.
3. Ask: `음식점 영업정지 2개월 처분을 받았는데 줄일 수 있나요?`
4. Confirm result shows:
   - `penalty_basis` route or equivalent badge
   - 관련 법령 section
   - 확인해야 할 사실 section
   - source list
   - disclaimer
