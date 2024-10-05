import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ShapeProvider } from "./context/shapeContext.jsx";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ShapeProvider>
      <App />
    </ShapeProvider>
  </StrictMode>
);
