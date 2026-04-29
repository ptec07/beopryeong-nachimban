import { Source } from '../types';

interface SourceListProps {
  sources: Source[];
}

const confidenceLabels: Record<Source['confidence'], string> = {
  direct: '직접 근거',
  supporting: '보조 근거',
  similar: '유사 사례',
  needs_confirmation: '추가 확인 필요',
};

export function SourceList({ sources }: SourceListProps) {
  return (
    <section className="card sources">
      <h2>원문 근거</h2>
      <ul>
        {sources.map((source) => (
          <li key={source.id}>
            <strong>{source.title}</strong>
            <span className="badge">{confidenceLabels[source.confidence]}</span>
            <p>{source.citation}</p>
            {source.url ? <a href={source.url}>원문 보기</a> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
