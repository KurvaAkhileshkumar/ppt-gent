import React, { useState } from "react";
import {
  Box, Typography, TextField, Button, Stepper, Step, StepLabel,
  Grid, MenuItem, Card, CardContent, Checkbox, CircularProgress,
  Alert, Chip, IconButton, Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useNavigate } from "react-router-dom";
import api from "../api";

const STEPS = ["Series topic", "Refine", "Review outline", "Pick a theme"];
const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "CHEM", "OTHER"];
const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];
const THEMES = [
  { value: "dark", label: "Dark", description: "Navy & gold — professional" },
  { value: "light", label: "Light", description: "Clean white — minimal" },
  { value: "simple", label: "Simple", description: "Black & white — no frills" },
];

export default function CreateSeries() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seriesId, setSeriesId] = useState(null);
  const [outline, setOutline] = useState([]);

  const [form, setForm] = useState({
    topic: "", subject: "", branch: "", semester: "", university: "",
    lesson_count: 3, slides_per_lesson: 10, additional_instructions: "",
    include_learning_goals: true, include_key_vocabulary: false,
    include_activity_sheet: false, include_co_mapping: false,
    include_previous_recap: true, theme: "dark",
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const toggle = (field) => () => setForm({ ...form, [field]: !form[field] });

  // Step 0 → 1
  const goToRefine = () => setStep(1);

  // Step 1 → 2: generate outline
  const generateOutline = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/series/", form);
      setSeriesId(res.data.series.id);
      setOutline(res.data.series.outline_json?.lessons || []);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Outline generation failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: edit outline
  const updateOutlineItem = (index, field, value) => {
    const updated = [...outline];
    updated[index] = { ...updated[index], [field]: value };
    setOutline(updated);
  };

  const deleteOutlineItem = (index) => {
    setOutline(outline.filter((_, i) => i !== index));
  };

  const saveOutline = async () => {
    await api.put(`/series/${seriesId}/outline`, { outline_json: { lessons: outline } });
    setStep(3);
  };

  // Step 3: generate all lessons
  const generateLessons = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post(`/series/${seriesId}/generate`);
      navigate(`/series/${seriesId}`);
    } catch (err) {
      setError(err.response?.data?.error || "Generation failed");
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 720, mx: "auto" }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/")} sx={{ mb: 3 }}>Back</Button>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {/* Step 0 */}
      {step === 0 && (
        <Box>
          <Typography variant="h5" fontWeight={700} mb={0.5}>Pick your series topic</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>First, we need an outline</Typography>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField label="Series topic" fullWidth required autoFocus
                placeholder="e.g. Graph Algorithms" value={form.topic} onChange={set("topic")} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Subject" fullWidth value={form.subject} onChange={set("subject")} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="University" fullWidth value={form.university} onChange={set("university")} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField select label="Branch" fullWidth value={form.branch} onChange={set("branch")}>
                <MenuItem value=""><em>Any</em></MenuItem>
                {BRANCHES.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField select label="Semester" fullWidth value={form.semester} onChange={set("semester")}>
                <MenuItem value=""><em>Any</em></MenuItem>
                {SEMESTERS.map((s) => <MenuItem key={s} value={s}>Sem {s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField select label="Lessons" fullWidth value={form.lesson_count}
                onChange={(e) => setForm({ ...form, lesson_count: Number(e.target.value) })}>
                {[2, 3, 4, 5, 6, 8, 10].map((n) => <MenuItem key={n} value={n}>{n} lessons</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField select label="Slides / lesson" fullWidth value={form.slides_per_lesson}
                onChange={(e) => setForm({ ...form, slides_per_lesson: Number(e.target.value) })}>
                {[6, 8, 10, 12, 15].map((n) => <MenuItem key={n} value={n}>{n} slides</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField label="Additional instructions (optional)" fullWidth multiline rows={2}
                value={form.additional_instructions} onChange={set("additional_instructions")} />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained" size="large" disabled={!form.topic.trim()} onClick={goToRefine}>
              Next
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <Box>
          <Typography variant="h5" fontWeight={700} mb={0.5}>Refine your series</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Pick preferences and we'll create your outline</Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {[
            { field: "include_learning_goals", label: "Learning objectives", desc: "Bloom's taxonomy-tagged objectives in each lesson" },
            { field: "include_key_vocabulary", label: "Key vocabulary", desc: "Important terms slide in each lesson" },
            { field: "include_co_mapping", label: "CO mapping", desc: "Course Outcome tags on objectives" },
            { field: "include_previous_recap", label: "Previous lesson recap", desc: "Each lesson starts with a recap of the prior one" },
            { field: "include_activity_sheet", label: "Activity sheets", desc: "Generate worksheets for each lesson" },
          ].map(({ field, label, desc }) => (
            <Card key={field} variant="outlined"
              sx={{ mb: 1.5, cursor: "pointer", borderColor: form[field] ? "primary.main" : "divider", bgcolor: form[field] ? "rgba(26,107,90,0.05)" : "transparent" }}
              onClick={toggle(field)}>
              <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 }, display: "flex", alignItems: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>{label}</Typography>
                  <Typography variant="caption" color="text.secondary">{desc}</Typography>
                </Box>
                <Checkbox checked={form[field]} color="primary" />
              </CardContent>
            </Card>
          ))}

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setStep(0)}>Back</Button>
            <Button variant="contained" size="large" disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={generateOutline}>
              {loading ? "Generating outline..." : "Generate outline"}
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 2 - Review outline */}
      {step === 2 && (
        <Box>
          <Typography variant="h5" fontWeight={700} mb={0.5}>Review your outline</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Almost done. This is the plan for your lessons.</Typography>

          {outline.map((item, i) => (
            <Card key={i} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip label={`${i + 1}`} size="small" color="primary" />
                    <TextField
                      variant="standard" value={item.title}
                      onChange={(e) => updateOutlineItem(i, "title", e.target.value)}
                      inputProps={{ style: { fontWeight: 700, fontSize: 15 } }}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  <IconButton size="small" onClick={() => deleteOutlineItem(i)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <TextField
                  label="Lesson content" multiline rows={3} fullWidth variant="outlined"
                  value={item.content_description || ""}
                  onChange={(e) => updateOutlineItem(i, "content_description", e.target.value)}
                  size="small"
                />
              </CardContent>
            </Card>
          ))}

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setStep(1)}>Back</Button>
            <Button variant="contained" size="large" onClick={saveOutline}>Continue</Button>
          </Box>
        </Box>
      )}

      {/* Step 3 - Theme + generate */}
      {step === 3 && (
        <Box>
          <Typography variant="h5" fontWeight={700} mb={0.5}>Last of all. Pick a theme.</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Applied to all lessons in this series.</Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={2} mb={4}>
            {THEMES.map((t) => (
              <Grid size={{ xs: 12, sm: 4 }} key={t.value}>
                <Card variant="outlined" onClick={() => setForm({ ...form, theme: t.value })}
                  sx={{ cursor: "pointer", borderColor: form.theme === t.value ? "primary.main" : "divider",
                    borderWidth: form.theme === t.value ? 2 : 1,
                    bgcolor: t.value === "dark" ? "#1e2847" : t.value === "light" ? "#fff" : "#f8f8f8" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} color={t.value === "dark" ? "#f5c518" : "text.primary"}>
                      {t.label}
                    </Typography>
                    <Typography variant="caption" color={t.value === "dark" ? "rgba(255,255,255,0.5)" : "text.secondary"}>
                      {t.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setStep(2)}>Back</Button>
            <Button variant="contained" size="large" disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={generateLessons}>
              {loading ? `Generating ${outline.length} lessons...` : "Generate all lessons"}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
