export type Audience = 'general_user' | 'small_business' | 'unknown';
export type Intent =
  | 'law_discovery'
  | 'article_lookup'
  | 'penalty_basis'
  | 'dispute_prep'
  | 'case_search'
  | 'contract_review'
  | 'procedure_detail'
  | 'amendment_track';

export interface AskRequest {
  question: string;
  mode: 'auto' | 'law' | 'case' | 'penalty' | 'contract' | 'procedure' | 'amendment';
  documentText?: string | null;
}

export interface RouteDecision {
  audience: Audience;
  intent: Intent;
  subIntents: Intent[];
  legalDomain: string;
  situationType: string;
  urgency: 'low' | 'medium' | 'high';
  needsDocument: boolean;
  needsClarification: boolean;
  clarificationQuestions: string[];
  toolPlan: string[];
}

export interface AnswerSection {
  title: string;
  items: string[];
}

export interface Source {
  id: string;
  type: 'law' | 'annex' | 'precedent' | 'admin_appeal' | 'interpretation' | 'document' | 'other';
  title: string;
  citation: string;
  url: string | null;
  confidence: 'direct' | 'supporting' | 'similar' | 'needs_confirmation';
}

export interface AskResponse {
  answerId: string;
  route: RouteDecision;
  summary: string;
  sections: AnswerSection[];
  sources: Source[];
  followUps: string[];
  disclaimer: string;
}
