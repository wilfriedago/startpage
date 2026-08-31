import "./content-panel.css";
import "./note-panel.css";

import { useStore } from "../store";

export function Note() {
  const { note, noteRef, setNote } = useStore();

  return (
    <section className="panel note">
      <h2 className="label">Note</h2>
      <textarea
        aria-label="Scratchpad"
        className="note__area"
        onInput={(event) => setNote(event.currentTarget.value)}
        placeholder="Scratchpad…"
        ref={noteRef}
        value={note}
      />
    </section>
  );
}
