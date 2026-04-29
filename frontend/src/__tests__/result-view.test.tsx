import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ResultView } from '../components/ResultView';


describe('ResultView', () => {
  it('renders summary, sections, sources, and disclaimer', () => {
    render(<ResultView result={{
      answerId: 'id',
      route: {
        audience: 'small_business',
        intent: 'penalty_basis',
        subIntents: [],
        legalDomain: '식품위생',
        situationType: '행정처분',
        urgency: 'medium',
        needsDocument: false,
        needsClarification: true,
        clarificationQuestions: [],
        toolPlan: [],
      },
      summary: '감경 가능성이 있을 수 있습니다.',
      sections: [{ title: '관련 법령', items: ['식품위생법'] }],
      sources: [{ id: 's1', type: 'law', title: '식품위생법', citation: '관련 조문', url: null, confidence: 'direct' }],
      followUps: ['처분서 분석하기'],
      disclaimer: '법률 자문을 대체하지 않습니다.',
    }} onFollowUp={vi.fn()} />);
    expect(screen.getByText('감경 가능성이 있을 수 있습니다.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '관련 법령' })).toBeInTheDocument();
    expect(screen.getAllByText('식품위생법').length).toBeGreaterThan(0);
    expect(screen.getByText('법률 자문을 대체하지 않습니다.')).toBeInTheDocument();
  });
});
