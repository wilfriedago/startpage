import "./controls.css";
import "./settings-modal.css";

import type { ComponentChildren } from "preact";

import { Overlay } from "../modal-overlay";
import { useStore } from "../../store";
import { AppearanceTab } from "./appearance-tab";
import { DataTab } from "./data-tab";
import { IntegrationsTab } from "./integrations-tab";
import { PanelsTab } from "./panels-tab";
import { ShortcutsTab } from "./shortcuts-tab";
import { SoundTab } from "./sound-tab";
import { TimeTab } from "./time-tab";
import { WeatherTab } from "./weather-tab";

interface Tab {
  hint: string;
  id: string;
  label: string;
  render: () => ComponentChildren;
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
