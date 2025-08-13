// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

console.log("[main] booting");          // <— should appear on reload
const root = document.getElementById("root");
createRoot(root).render(<App />);
