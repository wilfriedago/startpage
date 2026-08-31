import { useStore } from "../store";

export function Note() {
  const { note, noteRef, setNote } = useStore();

  return (
    <section className="panel note">
      <h2 className="label">Note</h2>
      <textarea
        aria-label="Scratchpad"
        className="note__area"
        onChange={(event) => setNote(event.target.value)}
        placeholder="Scratchpad…"
        ref={noteRef}
        value={note}
      />
    </section>
  );
}
