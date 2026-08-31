import "video.js/dist/video-js.css";

import "./styles/base.css";
import "./styles/app.css";
import "./styles/videojs.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app";
import { StoreProvider } from "./store";

const root = document.querySelector("#app");
if (!root) {
  throw new Error("Startpage root element is missing");
}

createRoot(root).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
