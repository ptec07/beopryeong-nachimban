const topics = [
  '영업정지/과태료',
  '임대차/전세',
  '상가 권리금',
  '계약서 검토',
  '노동/해고',
  '개인정보',
  '판례 찾기',
];

interface QuickTopicsProps {
  onSelect: (topic: string) => void;
  disabled?: boolean;
}

export function QuickTopics({ onSelect, disabled = false }: QuickTopicsProps) {
  return (
    <div className="quick-topics" aria-label="빠른 주제">
      {topics.map((topic) => (
        <button key={topic} type="button" onClick={() => onSelect(topic)} disabled={disabled}>
          {topic}
        </button>
      ))}
    </div>
  );
}
