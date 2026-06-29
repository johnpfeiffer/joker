import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./views/App";

const theme = createTheme({
  shape: {
    borderRadius: 6,
  },
  typography: {
    h1: {
      fontSize: "1.5rem",
      fontWeight: 700,
      letterSpacing: 0,
    },
    h2: {
      fontSize: "1rem",
      fontWeight: 700,
      letterSpacing: 0,
    },
    button: {
      letterSpacing: 0,
      textTransform: "none",
    },
  },
});

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
