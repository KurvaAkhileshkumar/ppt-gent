import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#4361EE",
      light: "#6E84F5",
      dark: "#2D4BD4",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#3ECFCF",
      dark: "#2AAFAF",
      contrastText: "#ffffff",
    },
    background: {
      default: "#F7F8FC",
      paper: "#ffffff",
    },
    text: {
      primary: "#0D1117",
      secondary: "#6B7491",
    },
    divider: "#E5E8F2",
    success: { main: "#10B981" },
    warning: { main: "#F59E0B" },
    error:   { main: "#EF4444" },
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
    h1: { fontWeight: 700, letterSpacing: -0.5 },
    h2: { fontWeight: 700, letterSpacing: -0.5 },
    h3: { fontWeight: 600, letterSpacing: -0.25 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, letterSpacing: 0 },
  },
  shape: { borderRadius: 12 },
  shadows: [
    "none",
    "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
    "0 2px 8px rgba(16,24,40,0.07), 0 1px 3px rgba(16,24,40,0.04)",
    "0 4px 16px rgba(16,24,40,0.08), 0 2px 6px rgba(16,24,40,0.04)",
    "0 8px 24px rgba(16,24,40,0.09), 0 4px 10px rgba(16,24,40,0.04)",
    "0 12px 32px rgba(16,24,40,0.10)",
    ...Array(19).fill("none"),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 10,
          padding: "8px 18px",
          transition: "all 0.18s ease",
        },
        contained: {
          boxShadow: "0 2px 8px rgba(67,97,238,0.25)",
          "&:hover": { boxShadow: "0 4px 16px rgba(67,97,238,0.35)", transform: "translateY(-1px)" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 10px rgba(16,24,40,0.06)",
          borderRadius: 16,
          border: "1px solid #E5E8F2",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: { "& .MuiOutlinedInput-root": { borderRadius: 10 } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: 12 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 8, height: 5 },
      },
    },
  },
});

export default theme;
