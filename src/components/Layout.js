import React from "react";
import {
  Box, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Typography, Avatar, Divider, Tooltip,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

const DRAWER_WIDTH = 220;

const NAV = [
  { label: "Home", icon: <HomeIcon />, path: "/" },
  { label: "Lessons", icon: <MenuBookIcon />, path: "/lessons" },
  { label: "Lesson Series", icon: <LibraryBooksIcon />, path: "/series" },
  { label: "Activity Sheets", icon: <AssignmentIcon />, path: "/activity-sheets" },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            bgcolor: "#13163A",
            color: "#fff",
            border: "none",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ px: 3, py: 3 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: "#ffffff", letterSpacing: -0.5 }}>
            Edu<Typography component="span" sx={{ color: "#6E84F5", fontWeight: 800, fontSize: "inherit" }}>Forge</Typography>
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
            AI for Engineering Faculty
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        {/* Nav */}
        <List sx={{ px: 1, pt: 1, flex: 1 }}>
          {NAV.map(({ label, icon, path }) => {
            const active = location.pathname === path;
            return (
              <ListItemButton
                key={path}
                onClick={() => navigate(path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  bgcolor: active ? "rgba(123,143,255,0.15)" : "transparent",
                  color: active ? "#7B8FFF" : "rgba(255,255,255,0.65)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "#fff" },
                }}
              >
                <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>{icon}</ListItemIcon>
                <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 500 }} />
              </ListItemButton>
            );
          })}
        </List>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        {/* User */}
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: "#2B3BAB", fontSize: 14, fontWeight: 700 }}>
            {user?.full_name?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <Typography variant="body2" fontWeight={600} color="#fff" noWrap>
              {user?.full_name}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.4)" noWrap>
              {user?.department || user?.institution_name || "Faculty"}
            </Typography>
          </Box>
          <Tooltip title="Logout">
            <LogoutIcon
              sx={{ fontSize: 18, color: "rgba(255,255,255,0.4)", cursor: "pointer", "&:hover": { color: "#fff" } }}
              onClick={handleLogout}
            />
          </Tooltip>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", minHeight: "100vh" }}>
        {children}
      </Box>
    </Box>
  );
}
