import { groupSources } from "../../lib/application/skills-index";
import type { SourceRecord } from "../../lib/models/skill";

interface SourceListProps {
  sources: SourceRecord[];
  selectedSourceId: string | "all";
  onSelectSource: (sourceId: string | "all") => void;
}

export function SourceList({
  sources,
  selectedSourceId,
  onSelectSource,
}: SourceListProps) {
  const grouped = groupSources(sources);

  return (
    <aside aria-label="Sources" className="sources-panel">
      <div className="section-heading">
        <span>来源</span>
        <button
          className={selectedSourceId === "all" ? "chip is-active" : "chip"}
          onClick={() => onSelectSource("all")}
          type="button"
        >
          全部
        </button>
      </div>

      <SourceGroup
        label="内置来源"
        sources={grouped.builtin}
        selectedSourceId={selectedSourceId}
        onSelectSource={onSelectSource}
      />
      <SourceGroup
        label="自定义目录"
        sources={grouped.custom}
        selectedSourceId={selectedSourceId}
        onSelectSource={onSelectSource}
      />
    </aside>
  );
}

function SourceGroup({
  label,
  sources,
  selectedSourceId,
  onSelectSource,
}: {
  label: string;
  sources: SourceRecord[];
  selectedSourceId: string | "all";
  onSelectSource: (sourceId: string | "all") => void;
}) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="source-group">
      <p className="muted-label">{label}</p>
      {sources.map((source) => (
        <button
          key={source.id}
          className={selectedSourceId === source.id ? "source-item is-active" : "source-item"}
          onClick={() => onSelectSource(source.id)}
          type="button"
        >
          <span>{source.name}</span>
          <span className={`status-dot is-${source.status}`} />
        </button>
      ))}
    </div>
  );
}
