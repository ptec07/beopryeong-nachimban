import { describe, expect, it, vi, afterEach } from 'vitest';

import { askLegalCompass, buildApiUrl } from '../api';

describe('API URL builder', () => {
  it('defaults to same-origin /api for local development', () => {
    expect(buildApiUrl('/ask')).toBe('/api/ask');
    expect(buildApiUrl('ask')).toBe('/api/ask');
  });

  it('uses an absolute backend base URL for production deployments', () => {
    expect(buildApiUrl('/ask', 'https://beopryeong-nachimban-api.onrender.com')).toBe(
      'https://beopryeong-nachimban-api.onrender.com/api/ask',
    );
    expect(buildApiUrl('/ask', 'https://beopryeong-nachimban-api.onrender.com/api')).toBe(
      'https://beopryeong-nachimban-api.onrender.com/api/ask',
    );
  });
});

describe('askLegalCompass', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('posts questions to the configured backend API base URL', async () => {
    const responsePayload = {
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
      summary: '요약',
      sections: [],
      sources: [],
      followUps: [],
      disclaimer: '안내',
    };
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => responsePayload,
    }));
    vi.stubGlobal('fetch', fetchMock);

    await askLegalCompass({ question: '음식점 영업정지?', mode: 'auto' }, 'https://api.example.com');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/ask',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
