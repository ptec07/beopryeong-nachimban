import { AskResponse } from '../types';
import { SourceList } from './SourceList';

interface ResultViewProps {
  result: AskResponse;
}

export function ResultView({ result }: ResultViewProps) {
  return (
    <article className="result-view">
      <section className="card summary-card">
        <div className="route-badges">
          <span className="badge">{result.route.intent}</span>
          <span className="badge secondary">{result.route.legalDomain}</span>
        </div>
        <h2>한 줄 결론</h2>
        <p>{result.summary}</p>
      </section>

      {result.sections.map((section) => (
        <section className="card" key={section.title}>
          <h2>{section.title}</h2>
          <ul>
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}

      <SourceList sources={result.sources} />

      <section className="card followups">
        <h2>후속 질문</h2>
        <div>
          {result.followUps.map((followUp) => (
            <button type="button" key={followUp}>{followUp}</button>
          ))}
        </div>
      </section>

      <p className="disclaimer">{result.disclaimer}</p>
    </article>
  );
}
