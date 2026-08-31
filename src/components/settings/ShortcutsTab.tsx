import { useStore } from "../../store";
import { RemoveButton } from "./controls";

export function ShortcutsTab() {
  const { addShortcut, removeShortcut, shortcuts, updateShortcut } = useStore();

  return (
    <div className="stack" style={{ gap: 10 }}>
      {shortcuts.map((shortcut, index) => (
        <div className="editor-row editor-row--pair" key={index}>
          <input
            aria-label="Shortcut name"
            className="field"
            onChange={(event) => updateShortcut(index, { name: event.target.value })}
            placeholder="Name"
            value={shortcut.name}
          />
          <input
            aria-label="Shortcut URL"
            className="field field--mono"
            onChange={(event) => updateShortcut(index, { url: event.target.value })}
            placeholder="https://"
            value={shortcut.url}
          />
          <RemoveButton
            label={`Remove ${shortcut.name || "shortcut"}`}
            onClick={() => removeShortcut(index)}
          />
        </div>
      ))}
      <button className="add-button" onClick={addShortcut} type="button">
        Add shortcut
      </button>
      <p className="footnote">
        A web page can&rsquo;t read browser bookmarks — that needs a Helium extension or new-tab
        override, so shortcuts live here. The defaults come from <code>dashboard.yml</code>.
      </p>
    </div>
  );
}
