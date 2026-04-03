import React, { useState } from "react";
import {
  Box, Button, TextField, Typography, Paper,
  Alert, Link, CircularProgress,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Paper sx={{ p: 5, width: "100%", maxWidth: 420 }}>
        <Typography variant="h4" fontWeight={700} color="primary" mb={0.5}>
          EduForge
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          AI lesson planner for engineering faculty
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Email" type="email" fullWidth required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password" type="password" fullWidth required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            sx={{ mb: 3 }}
          />
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
            {loading ? <CircularProgress size={22} color="inherit" /> : "Sign in"}
          </Button>
        </Box>

        <Typography variant="body2" textAlign="center" mt={2}>
          Don't have an account?{" "}
          <Link component={RouterLink} to="/register" fontWeight={600}>Sign up</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
