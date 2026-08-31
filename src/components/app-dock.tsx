import "./app-dock.css";

import { useStore } from "../store";

export function Dock() {
  const { focus, openSettings, toggleFocus } = useStore();

  return (
    <div className="dock">
      <button
        className={focus ? "dock__button dock__button--on" : "dock__button"}
        onClick={toggleFocus}
        title="Focus mode (f)"
        type="button"
      >
        <svg fill="none" height="15" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 16 16" width="15">
          <circle cx="8" cy="8" r="5.6" />
          <circle cx="8" cy="8" fill="currentColor" r="1.8" stroke="none" />
        </svg>
        <span className="sr-only">Focus mode</span>
      </button>
      <button className="dock__button" onClick={openSettings} title="Settings (,)" type="button">
        <svg fill="none" height="15" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 16 16" width="15">
          <line x1="2" x2="14" y1="5" y2="5" />
          <line x1="2" x2="14" y1="11" y2="11" />
          <circle cx="6" cy="5" fill="currentColor" r="1.9" stroke="none" />
          <circle cx="10.5" cy="11" fill="currentColor" r="1.9" stroke="none" />
        </svg>
        <span className="sr-only">Settings</span>
      </button>
    </div>
  );
}
