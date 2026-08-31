import type { Keys } from "../../lib/types";
import { useStore } from "../../store";

const INTEGRATIONS: [keyof Keys, string, string][] = [
  ["google", "Google Calendar", "OAuth client ID"],
  ["apple", "Apple Calendar", "CalDAV app password"],
  ["todoist", "Todoist", "API token"],
];

export function IntegrationsTab() {
  const { keys, setKey } = useStore();

  return (
    <div className="stack" style={{ gap: 12 }}>
      {INTEGRATIONS.map(([id, label, hint]) => (
        <div className="editor-row editor-row--integration" key={id}>
          <span className="inline-row__label">{label}</span>
          <input
            aria-label={label}
            className="field field--mono"
            onChange={(event) => setKey(id, event.target.value)}
            placeholder={hint}
            type="password"
            value={keys[id]}
          />
        </div>
      ))}
      <p className="footnote">
        Keys stay in this browser&rsquo;s local storage. Sync itself still needs an OAuth step — say
        which service to wire first.
      </p>
    </div>
  );
}
