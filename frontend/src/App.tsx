import { useState } from 'react';

import { askLegalCompass } from './api';
import { QuestionForm } from './components/QuestionForm';
import { QuickTopics } from './components/QuickTopics';
import { ResultView } from './components/ResultView';
import { AskResponse } from './types';
import './styles.css';

function topicToQuestion(topic: string): string {
  const examples: Record<string, string> = {
    '영업정지/과태료': '음식점 영업정지 처분을 받았는데 줄일 수 있나요?',
    '임대차/전세': '전세보증금을 못 돌려받고 있어요. 어떤 법을 봐야 하나요?',
    '상가 권리금': '상가 임대인이 권리금 회수를 방해하는 것 같아요.',
    '계약서 검토': '이 계약서에서 불리한 조항을 찾아주세요.',
    '노동/해고': '직원 해고 전에 확인해야 할 법이 있나요?',
    개인정보: '개인정보 유출이 발생했는데 어디에 신고하고 어떤 법을 봐야 하나요?',
    '판례 찾기': '비슷한 사건의 판례와 행정심판례를 찾아주세요.',
  };
  return examples[topic] ?? topic;
}

export default function App() {
  const [result, setResult] = useState<AskResponse | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submitQuestion(question: string) {
    setStatus('loading');
    setError(null);
    try {
      const response = await askLegalCompass({ question, mode: 'auto' });
      setResult(response);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">자연어 법령 리서치</p>
        <h1>법령나침반</h1>
        <p>법령명을 몰라도 괜찮습니다. 내 상황을 입력하면 관련 법령과 근거를 찾아드립니다.</p>
      </header>

      <section className="search-panel">
        <QuestionForm onSubmit={submitQuestion} disabled={status === 'loading'} />
        <QuickTopics onSelect={(topic) => submitQuestion(topicToQuestion(topic))} disabled={status === 'loading'} />
      </section>

      {status === 'loading' ? <p className="status">근거를 찾는 중입니다...</p> : null}
      {status === 'error' ? <p className="status error">{error}</p> : null}
      {result ? <ResultView result={result} onFollowUp={submitQuestion} disabled={status === 'loading'} /> : null}
    </main>
  );
}
