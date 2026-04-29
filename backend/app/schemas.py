from typing import Literal

from pydantic import BaseModel, Field

Audience = Literal["general_user", "small_business", "unknown"]
Intent = Literal[
    "law_discovery",
    "article_lookup",
    "penalty_basis",
    "dispute_prep",
    "case_search",
    "contract_review",
    "procedure_detail",
    "amendment_track",
]
Urgency = Literal["low", "medium", "high"]
SourceType = Literal["law", "annex", "precedent", "admin_appeal", "interpretation", "document", "other"]
Confidence = Literal["direct", "supporting", "similar", "needs_confirmation"]
Mode = Literal["auto", "law", "case", "penalty", "contract", "procedure", "amendment"]


class AskRequest(BaseModel):
    question: str = Field(min_length=1)
    mode: Mode = "auto"
    documentText: str | None = None


class RouteDecision(BaseModel):
    audience: Audience = "unknown"
    intent: Intent
    subIntents: list[Intent] = Field(default_factory=list)
    legalDomain: str = "일반"
    situationType: str = "일반"
    urgency: Urgency = "low"
    needsDocument: bool = False
    needsClarification: bool = False
    clarificationQuestions: list[str] = Field(default_factory=list)
    toolPlan: list[str] = Field(default_factory=list)


class AnswerSection(BaseModel):
    title: str
    items: list[str] = Field(default_factory=list)


class Source(BaseModel):
    id: str
    type: SourceType
    title: str
    citation: str
    url: str | None = None
    confidence: Confidence = "supporting"


class LegalResearchResult(BaseModel):
    summary: str
    sections: list[AnswerSection] = Field(default_factory=list)
    sources: list[Source] = Field(default_factory=list)


class AskResponse(BaseModel):
    answerId: str
    route: RouteDecision
    summary: str
    sections: list[AnswerSection]
    sources: list[Source]
    followUps: list[str]
    disclaimer: str
