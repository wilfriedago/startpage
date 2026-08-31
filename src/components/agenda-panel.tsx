import { Panel } from "./content-panel";
import { EntryInput, EventRow } from "./rows";
import { useStore } from "../store";

export function Agenda() {
  const { addEvent, eventRef, events, removeEvent, today } = useStore();
  const todays = events
    .filter((event) => event.date === today)
    .sort((a, b) => a.at.localeCompare(b.at));

  return (
    <Panel
      meta={todays.length ? `${todays.length} item${todays.length > 1 ? "s" : ""}` : "empty"}
      title="Today"
    >
      <div className="rows rows--gapped">
        {todays.map((event) => (
          <EventRow event={event} key={event.id} onRemove={removeEvent} />
        ))}
      </div>
      {todays.length === 0 && (
        <p className="panel__empty">Nothing scheduled. Add one below, or connect a calendar.</p>
      )}
      <EntryInput
        onSubmit={(value) => addEvent(value, today)}
        placeholder="09:30 Standup — press ⏎"
        inputRef={eventRef}
      />
    </Panel>
  );
}
