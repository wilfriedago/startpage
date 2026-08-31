import { useEffect } from "react";

import { Agenda } from "./components/Agenda";
import { ClockBlock } from "./components/ClockBlock";
import { DayModal } from "./components/DayModal";
import { Dock } from "./components/Dock";
import { Greeting } from "./components/Greeting";
import { VideoHost } from "./components/VideoHost";
import { Note } from "./components/Note";
import { Player } from "./components/Player";
import { Shortcuts } from "./components/Shortcuts";
import { Tasks } from "./components/Tasks";
import { Tooltip } from "./components/Tooltip";
import { WorldClocks } from "./components/WorldClocks";
import { YearDots } from "./components/YearDots";
import { SettingsModal } from "./components/settings/SettingsModal";
import { youtubeId } from "./lib/media";
import { useStore } from "./store";

const HINTS = ["1 agenda", "2 task", "3 note", "4 play", "f focus", ", settings"];

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export function App() {
  const store = useStore();
  const {
    appearance,
    closeDay,
    closeSettings,
    day,
    eventRef,
    focus,
    noteRef,
    openSettings,
    panels,
    muted,
    playing,
    seekTo,
    setMediaState,
    settingsOpen,
    setTip,
    source,
    volume,
    taskRef,
    toggleFocus,
    togglePlay,
    videoMode,
    ytUrl,
  } = store;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      // Inside a field, Escape only means "let go of this field".
      if (isEditable(event.target)) {
        if (event.key === "Escape") {
          (event.target as HTMLElement).blur();
        }
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      switch (event.key) {
        case "Escape":
          closeSettings();
          closeDay();
          setTip(null);
          return;
        case ",":
          event.preventDefault();
          openSettings();
          return;
        case "f":
          event.preventDefault();
          toggleFocus();
          return;
        case "1":
          event.preventDefault();
          eventRef.current?.focus();
          return;
        case "2":
          event.preventDefault();
          taskRef.current?.focus();
          return;
        case "3":
          event.preventDefault();
          noteRef.current?.focus();
          return;
        case "4":
          event.preventDefault();
          togglePlay();
          return;
        default:
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    closeDay,
    closeSettings,
    eventRef,
    noteRef,
    openSettings,
    setTip,
    taskRef,
    toggleFocus,
    togglePlay,
  ]);

  const videoId = youtubeId(ytUrl);
  const backgroundVideo = source === "video" && Boolean(videoId) && videoMode === "background";

  return (
    <div className="page">
      {backgroundVideo && (
        <div className="page__video">
          <VideoHost
            className="page__video-frame"
            controls={false}
            id={videoId}
            onState={setMediaState}
            seekTo={seekTo}
            shouldPlay={playing}
            volume={muted ? 0 : volume}
          />
          <div className="page__scrim" style={{ opacity: appearance.scrim / 100 }} />
        </div>
      )}

      <div className="page__body">
        {!focus && panels.greeting && <Greeting />}

        <div className="main">
          <div className="column">
            <ClockBlock />
            {!focus && panels.clocks && <WorldClocks />}
            {!focus && panels.links && <Shortcuts />}
            {!focus && panels.year && <YearDots />}
          </div>

          {!focus && (
            <aside className="periphery">
              {panels.agenda && <Agenda />}
              {panels.tasks && <Tasks />}
              {panels.note && <Note />}
              {panels.player && <Player />}
              {panels.hints && (
                <div className="hints">
                  {HINTS.map((hint) => (
                    <span key={hint}>{hint}</span>
                  ))}
                </div>
              )}
            </aside>
          )}
        </div>
      </div>

      <Dock />
      <Tooltip />
      {day && <DayModal />}
      {settingsOpen && <SettingsModal />}
    </div>
  );
}