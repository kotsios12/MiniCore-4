import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import BootSequence from "./components/BootSequence/BootSequence";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BootSequence>
      <App />
    </BootSequence>
  </StrictMode>,
);
