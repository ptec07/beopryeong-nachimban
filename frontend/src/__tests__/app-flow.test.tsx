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

  it('submits a follow-up question and replaces the answer with the new result', async () => {
    const followUpResponse = {
      ...mockResponse,
      answerId: 'follow-up-id',
      summary: '처분서 내용을 기준으로 감경 사유를 먼저 확인해야 합니다.',
      sections: [{ title: '처분서 체크포인트', items: ['위반 횟수', '처분 기간', '감경 사유'] }],
      followUps: ['감경 사례만 찾아보기'],
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => followUpResponse,
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.change(screen.getByLabelText('질문'), { target: { value: '음식점 영업정지 줄일 수 있어?' } });
    fireEvent.click(screen.getByText('근거 찾기'));
    await waitFor(() => expect(screen.getByText('영업정지 감경 가능성이 있을 수 있습니다.')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '처분서 분석하기' }));

    expect(screen.getByText('근거를 찾는 중입니다...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('처분서 내용을 기준으로 감경 사유를 먼저 확인해야 합니다.')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenLastCalledWith('/api/ask', expect.objectContaining({
      body: JSON.stringify({ question: '처분서 분석하기', mode: 'auto' }),
    }));
  });
});
