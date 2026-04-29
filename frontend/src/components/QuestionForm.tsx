import { FormEvent, useState } from 'react';

interface QuestionFormProps {
  onSubmit: (question: string) => void;
  disabled?: boolean;
}

export function QuestionForm({ onSubmit, disabled = false }: QuestionFormProps) {
  const [question, setQuestion] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <form className="question-form" onSubmit={handleSubmit}>
      <label htmlFor="question-input">질문</label>
      <textarea
        id="question-input"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="예: 음식점 영업정지 2개월 처분을 받았는데 줄일 수 있나요?"
        rows={4}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !question.trim()}>
        근거 찾기
      </button>
    </form>
  );
}
