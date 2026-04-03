import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import { AuthProvider, useAuth } from "./AuthContext";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Lessons from "./pages/Lessons";
import CreateLesson from "./pages/CreateLesson";
import LessonViewer from "./pages/LessonViewer";
import { SeriesList, SeriesDetail } from "./pages/Series";
import CreateSeries from "./pages/CreateSeries";
import { ActivitySheetList, CreateActivitySheet, ActivitySheetViewer } from "./pages/ActivitySheets";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Private */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

            <Route path="/lessons" element={<PrivateRoute><Lessons /></PrivateRoute>} />
            <Route path="/lessons/create" element={<PrivateRoute><CreateLesson /></PrivateRoute>} />
            <Route path="/lessons/:id" element={<PrivateRoute><LessonViewer /></PrivateRoute>} />

            <Route path="/series" element={<PrivateRoute><SeriesList /></PrivateRoute>} />
            <Route path="/series/create" element={<PrivateRoute><CreateSeries /></PrivateRoute>} />
            <Route path="/series/:id" element={<PrivateRoute><SeriesDetail /></PrivateRoute>} />

            <Route path="/activity-sheets" element={<PrivateRoute><ActivitySheetList /></PrivateRoute>} />
            <Route path="/activity-sheets/create" element={<PrivateRoute><CreateActivitySheet /></PrivateRoute>} />
            <Route path="/activity-sheets/:id" element={<PrivateRoute><ActivitySheetViewer /></PrivateRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
