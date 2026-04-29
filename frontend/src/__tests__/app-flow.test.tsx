import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '../App';

const mockResponse = {
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
  summary: '영업정지 감경 가능성이 있을 수 있습니다.',
  sections: [{ title: '관련 법령', items: ['식품위생법'] }],
  sources: [{ id: 's1', type: 'law', title: '식품위생법', citation: '관련 조문', url: null, confidence: 'direct' }],
  followUps: ['처분서 분석하기'],
  disclaimer: '법률 자문을 대체하지 않습니다.',
};

describe('App ask flow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits question and renders API answer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    })));

    render(<App />);
    fireEvent.change(screen.getByLabelText('질문'), { target: { value: '음식점 영업정지 줄일 수 있어?' } });
    fireEvent.click(screen.getByText('근거 찾기'));

    expect(screen.getByText('근거를 찾는 중입니다...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('영업정지 감경 가능성이 있을 수 있습니다.')).toBeInTheDocument());
  });
});
