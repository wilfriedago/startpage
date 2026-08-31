import type { PanelId } from "../../lib/types";
import { useStore } from "../../store";
import { Check } from "./controls";

const PANEL_LABELS: [PanelId, string][] = [
  ["greeting", "Greeting line"],
  ["weather", "Weather"],
  ["clocks", "World clocks"],
  ["links", "Shortcuts"],
  ["year", "Year dots"],
  ["agenda", "Today / agenda"],
  ["tasks", "Tasks"],
  ["note", "Note"],
  ["player", "Sound player"],
  ["hints", "Keyboard hints"],
];

export function PanelsTab() {
  const { panels, setPanel } = useStore();

  return (
    <div className="grid-2">
      {PANEL_LABELS.map(([id, label]) => (
        <Check
          boxed
          checked={panels[id]}
          key={id}
          label={label}
          onChange={(on) => setPanel(id, on)}
        />
      ))}
    </div>
  );
}
