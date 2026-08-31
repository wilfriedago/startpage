import type { ReactNode } from "react";

import { Overlay } from "../Overlay";
import { useStore } from "../../store";
import { AppearanceTab } from "./AppearanceTab";
import { DataTab } from "./DataTab";
import { IntegrationsTab } from "./IntegrationsTab";
import { PanelsTab } from "./PanelsTab";
import { ShortcutsTab } from "./ShortcutsTab";
import { SoundTab } from "./SoundTab";
import { TimeTab } from "./TimeTab";
import { WeatherTab } from "./WeatherTab";

interface Tab {
  hint: string;
  id: string;
  label: string;
  render: () => ReactNode;
}

const TABS: [Tab, ...Tab[]] = [
  {
    hint: "Theme, background, type, corners — the whole surface.",
    id: "appearance",
    label: "Appearance",
    render: () => <AppearanceTab />,
  },
  {
    hint: "Format, seconds, and the cities in your world clock row.",
    id: "time",
    label: "Clock & time",
    render: () => <TimeTab />,
  },
  {
    hint: "Where conditions are read from, and in which units.",
    id: "weather",
    label: "Weather",
    render: () => <WeatherTab />,
  },
  {
    hint: "Radio stations, noise, and the background video source.",
    id: "sound",
    label: "Sound & video",
    render: () => <SoundTab />,
  },
  {
    hint: "Turn any block of the page on or off.",
    id: "panels",
    label: "Panels",
    render: () => <PanelsTab />,
  },
  {
    hint: "The quick links under the clock.",
    id: "shortcuts",
    label: "Shortcuts",
    render: () => <ShortcutsTab />,
  },
  {
    hint: "Calendar and task services, stored locally.",
    id: "integrations",
    label: "Integrations",
    render: () => <IntegrationsTab />,
  },
  {
    hint: "Everything lives in this browser. Take it with you.",
    id: "data",
    label: "Data",
    render: () => <DataTab />,
  },
];

export function SettingsModal() {
  const { closeSettings, setSettingsTab, settingsTab } = useStore();
  const active = TABS.find((tab) => tab.id === settingsTab) ?? TABS[0];

  return (
    <Overlay className="overlay--settings" label="Settings" onClose={closeSettings}>
      <div className="settings">
        <nav className="settings__nav">
          <h2 className="label settings__nav-label">Settings</h2>
          {TABS.map((tab) => (
            <button
              aria-current={tab.id === active.id}
              className={tab.id === active.id ? "settings__tab settings__tab--on" : "settings__tab"}
              key={tab.id}
              onClick={() => setSettingsTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
          <div className="settings__spacer" />
          <button className="settings__close" onClick={closeSettings} type="button">
            Close · esc
          </button>
        </nav>

        <div className="settings__body">
          <div>
            <h3 className="settings__title">{active.label}</h3>
            <p className="settings__hint">{active.hint}</p>
          </div>
          {active.render()}
        </div>
      </div>
    </Overlay>
  );
}
