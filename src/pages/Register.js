import React, { useState } from "react";
import {
  Box, Button, TextField, Typography, Paper,
  Alert, Link, CircularProgress, Grid,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", email: "", password: "",
    institution_name: "", department: "", designation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
      <Paper sx={{ p: 5, width: "100%", maxWidth: 520 }}>
        <Typography variant="h4" fontWeight={700} color="primary" mb={0.5}>
          EduForge
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Create your account
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Full Name" fullWidth required value={form.full_name} onChange={set("full_name")} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Email" type="email" fullWidth required value={form.email} onChange={set("email")} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Password" type="password" fullWidth required value={form.password} onChange={set("password")} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Institution / University" fullWidth value={form.institution_name} onChange={set("institution_name")} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Department (e.g. CSE)" fullWidth value={form.department} onChange={set("department")} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Designation" fullWidth value={form.designation} onChange={set("designation")} placeholder="e.g. Asst. Professor" />
            </Grid>
          </Grid>

          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3 }} disabled={loading}>
            {loading ? <CircularProgress size={22} color="inherit" /> : "Create account"}
          </Button>
        </Box>

        <Typography variant="body2" textAlign="center" mt={2}>
          Already have an account?{" "}
          <Link component={RouterLink} to="/login" fontWeight={600}>Sign in</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
