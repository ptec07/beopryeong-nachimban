from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.answer_builder import build_answer
from app.providers import FixtureLegalResearchProvider
from app.router import classify_question
from app.schemas import AskRequest, AskResponse

app = FastAPI(title="법령나침반")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/ask", response_model=AskResponse)
async def ask(request: AskRequest) -> AskResponse:
    route = classify_question(request.question, request.documentText)
    return await build_answer(
        question=request.question,
        route=route,
        provider=FixtureLegalResearchProvider(),
        document_text=request.documentText,
    )
