import React, { useState, useEffect } from "react";
import {
  Box, Typography, TextField, Button, Stepper, Step,
  StepLabel, Grid, MenuItem, Checkbox,
  Card, CardContent, CircularProgress, Alert,
  Chip, IconButton, Tooltip, LinearProgress, Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";
import api from "../api";

const STEPS = ["Topic", "Preferences", "Theme", "Review plan"];

const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "CHEM", "OTHER"];
const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];
const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 50, label: "50 min" },
  { value: 60, label: "60 min" },
  { value: 75, label: "75 min" },
  { value: 90, label: "90 min" },
];

const PRESENTATION_STYLES = [
  { value: "concise",  label: "Concise",  desc: "Key points only — fast-paced, minimal text" },
  { value: "standard", label: "Standard", desc: "Balanced coverage with worked examples" },
  { value: "detailed", label: "Detailed", desc: "Comprehensive — derivations, multiple examples" },
  { value: "workshop", label: "Workshop", desc: "Activity-focused with exercises and hands-on problems" },
];

const CONTENT_LEVELS = [
  { value: "introductory", label: "Introductory", desc: "Define all terms, build from scratch" },
  { value: "intermediate", label: "Intermediate",  desc: "Assume basic domain knowledge" },
  { value: "advanced",     label: "Advanced",      desc: "Edge cases, nuances, research depth" },
];

const THEMES = [
  { value: "dark",     label: "Dark",     description: "Navy & gold — professional", bg: "#1E2847", tc: "#F5C518" },
  { value: "light",    label: "Light",    description: "Clean white — minimal",      bg: "#ffffff", tc: "#1E2847" },
  { value: "simple",   label: "Simple",   description: "B&W — no frills",            bg: "#FAFAF8", tc: "#222222" },
  { value: "ocean",    label: "Ocean",    description: "Deep teal — calm & focused", bg: "#0E2A38", tc: "#00D4C8" },
  { value: "saffron",  label: "Saffron",  description: "Warm amber — energetic",     bg: "#2C1810", tc: "#FF9933" },
  { value: "midnight", label: "Midnight", description: "Pure black — high contrast", bg: "#07070F", tc: "#4F6EF7" },
];

const SLIDE_TYPES = [
  { value: "title",               label: "Title" },
  { value: "learning_objectives", label: "Learning Objectives" },
  { value: "vocabulary",          label: "Vocabulary" },
  { value: "content",             label: "Content" },
  { value: "quiz",                label: "Quiz" },
  { value: "quiz_answer",         label: "Quiz Answer" },
  { value: "summary",             label: "Summary" },
  { value: "references",          label: "References" },
];

const SLIDE_TYPE_COLORS = {
  title: "#2B3BAB", learning_objectives: "#7B5EA7",
  vocabulary: "#0E7C61", content: "#2B3BAB",
  quiz: "#D4891A", quiz_answer: "#2E7D32",
  summary: "#37474F", references: "#546E7A",
};

const PLAN_CAPTIONS = [
  "Consulting the AI syllabus committee...",
  "Figuring out what your students probably Googled last night...",
  "Assembling a lecture plan that actually makes sense...",
  "Generating a smarter outline than your old PowerPoint...",
  "Brewing the perfect slide structure...",
];


function CaptionCycler({ captions, interval = 3200 }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((p) => (p + 1) % captions.length), interval);
    return () => clearInterval(t);
  }, [captions, interval]);
  return (
    <Typography variant="body2" color="text.secondary"
      sx={{ mt: 1.5, minHeight: 24, fontStyle: "italic" }}>
      {captions[idx]}
    </Typography>
  );
}

export default function CreateLesson() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    topic: "",
    subject: "",
    branch: "",
    semester: "",
    university: "",
    duration_minutes: 45,
    presentation_style: "standard",
    content_level: "intermediate",
    additional_instructions: "",
    include_learning_goals: true,
    include_key_vocabulary: false,
    include_activity_sheet: false,
    include_co_mapping: false,
    theme: "dark",
  });

  // Plan review state
  const [plan, setPlan] = useState(null);
  const [editingTitle, setEditingTitle] = useState(null);
  const [editTitleVal, setEditTitleVal] = useState("");
  const [editingDesc, setEditingDesc] = useState(null);
  const [editDescVal, setEditDescVal] = useState("");
  const [targetCount, setTargetCount] = useState(10);
  const [replanLoading, setReplanLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const toggle = (field) => () => setForm({ ...form, [field]: !form[field] });

  const handleFetchPlan = async () => {
    setPlanLoading(true);
    setError("");
    try {
      const res = await api.post("/lessons/plan", form);
      const p = res.data.plan;
      setPlan(p);
      setTargetCount(p.slides?.length || 10);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate plan. Try again.");
    } finally {
      setPlanLoading(false);
    }
  };

  const handleGenerate = async () => {
    setError("");
    try {
      const res = await api.post("/lessons/", { ...form, plan });
      navigate(`/lessons/${res.data.lesson.id}`, { state: { plan } });
    } catch (err) {
      setError(err.response?.data?.error || "Generation failed. Please try again.");
    }
  };

  const handleReplan = async () => {
    if (!window.confirm("Regenerate the layout? Your current edits will be replaced.")) return;
    setReplanLoading(true);
    setError("");
    try {
      const res = await api.post("/lessons/plan", { ...form, force_count: targetCount });
      const p = res.data.plan;
      setPlan(p);
      setTargetCount(p.slides?.length || targetCount);
    } catch (err) {
      setError(err.response?.data?.error || "Replan failed.");
    } finally {
      setReplanLoading(false);
    }
  };

  // ── Plan editing helpers ────────────────────────────────
  const updateSlide = (i, patch) => {
    setPlan({ ...plan, slides: plan.slides.map((s, idx) => idx === i ? { ...s, ...patch } : s) });
  };

  const moveSlide = (i, dir) => {
    const slides = [...plan.slides];
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    [slides[i], slides[j]] = [slides[j], slides[i]];
    // Renumber slide_number to keep them sequential
    setPlan({ ...plan, slides: slides.map((s, idx) => ({ ...s, slide_number: idx + 1 })) });
  };

  const deleteSlide = (i) => {
    if (plan.slides.length <= 3) return; // keep at least 3 slides
    const slides = plan.slides.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, slide_number: idx + 1 }));
    setPlan({ ...plan, slides });
    setTargetCount(slides.length);
  };

  const addSlide = () => {
    // Insert before summary/references
    const slides = [...plan.slides];
    const insertAt = Math.max(slides.length - 2, slides.length - 1);
    const newSlide = {
      slide_number: insertAt + 1,
      type: "content",
      title: "New Slide",
      description: "",
      key_points: [],
      needs_visual: false,
    };
    slides.splice(insertAt, 0, newSlide);
    const renumbered = slides.map((s, idx) => ({ ...s, slide_number: idx + 1 }));
    setPlan({ ...plan, slides: renumbered });
    setTargetCount(renumbered.length);
  };

  const startEditTitle = (i) => { setEditingTitle(i); setEditTitleVal(plan.slides[i].title); };
  const saveEditTitle = (i) => { updateSlide(i, { title: editTitleVal }); setEditingTitle(null); };
  const startEditDesc = (i) => { setEditingDesc(i); setEditDescVal(plan.slides[i].description || ""); };
  const saveEditDesc = (i) => { updateSlide(i, { description: editDescVal }); setEditingDesc(null); };

  // ── Rendered steps ──────────────────────────────────────
  return (
    <Box sx={{ p: 4, maxWidth: 760, mx: "auto" }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/")} sx={{ mb: 3 }}>Back</Button>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {/* ── Step 0: Topic ─────────────────────────────────── */}
      {step === 0 && (
        <Box>
          <Typography variant="h5" fontWeight={700} mb={0.5}>What are you teaching?</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            The more context you give, the better the slides.
          </Typography>

          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField label="Lesson topic" fullWidth required autoFocus
                placeholder="e.g. Bellman-Ford Algorithm, BJT Biasing, Laplace Transforms"
                value={form.topic} onChange={set("topic")} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Subject" fullWidth placeholder="e.g. Data Structures & Algorithms"
                value={form.subject} onChange={set("subject")} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="University" fullWidth placeholder="e.g. JNTUH, VTU, Anna University"
                value={form.university} onChange={set("university")} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select label="Branch" fullWidth value={form.branch} onChange={set("branch")}>
                <MenuItem value=""><em>Any branch</em></MenuItem>
                {BRANCHES.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select label="Semester" fullWidth value={form.semester} onChange={set("semester")}>
                <MenuItem value=""><em>Any semester</em></MenuItem>
                {SEMESTERS.map((s) => <MenuItem key={s} value={s}>Semester {s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select label="Lecture duration" fullWidth value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}>
                {DURATION_OPTIONS.map((d) => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField label="Additional instructions (optional)" fullWidth multiline rows={2}
                placeholder="Paste syllabus points, specify depth, or add any other notes..."
                value={form.additional_instructions} onChange={set("additional_instructions")} />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained" size="large" disabled={!form.topic.trim()} onClick={() => setStep(1)}>
              Continue
            </Button>
          </Box>
        </Box>
      )}

      {/* ── Step 1: Preferences ───────────────────────────── */}
      {step === 1 && (
        <Box>
          <Typography variant="h5" fontWeight={700} mb={0.5}>How should it be presented?</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Pick the style and depth that fits your class.
          </Typography>

          {/* Presentation style */}
          <Typography variant="subtitle2" fontWeight={700} mb={1.5} sx={{ letterSpacing: 0.3 }}>
            Presentation style
          </Typography>
          <Grid container spacing={1.5} mb={3}>
            {PRESENTATION_STYLES.map((s) => (
              <Grid size={{ xs: 12, sm: 6 }} key={s.value}>
                <Card variant="outlined" onClick={() => setForm({ ...form, presentation_style: s.value })} sx={{
                  cursor: "pointer", height: "100%",
                  borderColor: form.presentation_style === s.value ? "primary.main" : "divider",
                  borderWidth: form.presentation_style === s.value ? 2 : 1,
                  bgcolor: form.presentation_style === s.value ? "rgba(43,59,171,0.04)" : "transparent",
                  transition: "all 0.15s",
                }}>
                  <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                    <Typography variant="subtitle2" fontWeight={700}>{s.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Content level */}
          <Typography variant="subtitle2" fontWeight={700} mb={1.5} sx={{ letterSpacing: 0.3 }}>
            Content level
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
            {CONTENT_LEVELS.map((l) => (
              <Card key={l.value} variant="outlined" onClick={() => setForm({ ...form, content_level: l.value })} sx={{
                cursor: "pointer", flex: "1 1 150px",
                borderColor: form.content_level === l.value ? "primary.main" : "divider",
                borderWidth: form.content_level === l.value ? 2 : 1,
                bgcolor: form.content_level === l.value ? "rgba(43,59,171,0.04)" : "transparent",
                transition: "all 0.15s",
              }}>
                <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="subtitle2" fontWeight={700}>{l.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{l.desc}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {/* Extra toggles */}
          <Typography variant="subtitle2" fontWeight={700} mb={1.5} sx={{ letterSpacing: 0.3 }}>
            Include extras
          </Typography>
          {[
            { field: "include_learning_goals", label: "Learning objectives",  desc: "Bloom's-tagged objectives as the first content slide" },
            { field: "include_key_vocabulary", label: "Key vocabulary",       desc: "A dedicated slide of important terms and definitions" },
            { field: "include_activity_sheet", label: "Activity sheet",       desc: "Generate a companion worksheet alongside this lesson" },
            { field: "include_co_mapping",     label: "CO mapping",           desc: "Tag objectives to Course Outcomes and Bloom's levels" },
          ].map(({ field, label, desc }) => (
            <Card key={field} variant="outlined" sx={{
              mb: 1, cursor: "pointer",
              borderColor: form[field] ? "primary.main" : "divider",
              borderWidth: form[field] ? 2 : 1,
              bgcolor: form[field] ? "rgba(43,59,171,0.04)" : "transparent",
            }} onClick={toggle(field)}>
              <CardContent sx={{ py: 1.25, px: 2, "&:last-child": { pb: 1.25 }, display: "flex", alignItems: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>{label}</Typography>
                  <Typography variant="caption" color="text.secondary">{desc}</Typography>
                </Box>
                <Checkbox checked={form[field]} color="primary" disableRipple />
              </CardContent>
            </Card>
          ))}

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setStep(0)}>Back</Button>
            <Button variant="contained" size="large" onClick={() => setStep(2)}>Continue</Button>
          </Box>
        </Box>
      )}

      {/* ── Step 2: Theme ─────────────────────────────────── */}
      {step === 2 && (
        <Box>
          <Typography variant="h5" fontWeight={700} mb={0.5}>Pick a slide theme</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>You can change this after generation too.</Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={2} mb={3}>
            {THEMES.map((t) => (
              <Grid size={{ xs: 12, sm: 4 }} key={t.value}>
                <Card variant="outlined" onClick={() => setForm({ ...form, theme: t.value })} sx={{
                  cursor: "pointer",
                  borderColor: form.theme === t.value ? "primary.main" : "divider",
                  borderWidth: form.theme === t.value ? 2 : 1,
                  bgcolor: t.bg,
                  transition: "transform 0.1s",
                  "&:hover": { transform: "translateY(-2px)" },
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: t.tc }}>{t.label}</Typography>
                    <Typography variant="caption" sx={{ color: t.tc, opacity: 0.65 }}>{t.description}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Summary */}
          <Box sx={{ bgcolor: "rgba(43,59,171,0.04)", borderRadius: 2, p: 2.5, mb: 3 }}>
            <Typography variant="body2" fontWeight={600} mb={0.75}>Your lesson:</Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              <strong>{form.topic}</strong>
              {form.subject && ` · ${form.subject}`}
              {form.branch && ` · ${form.branch}`}
              {form.semester && ` · Sem ${form.semester}`}
              {` · ${form.duration_minutes} min`}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip label={form.presentation_style} size="small" />
              <Chip label={form.content_level} size="small" />
              {form.include_learning_goals && <Chip label="Learning objectives" size="small" />}
              {form.include_key_vocabulary && <Chip label="Key vocabulary" size="small" />}
              {form.include_co_mapping && <Chip label="CO mapping" size="small" />}
              {form.include_activity_sheet && <Chip label="Activity sheet" size="small" />}
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Button onClick={() => setStep(1)}>Back</Button>
            <Button variant="contained" size="large"
              startIcon={planLoading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={handleFetchPlan} disabled={planLoading}>
              {planLoading ? "Building plan..." : "Generate plan"}
            </Button>
          </Box>

          {planLoading && (
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <LinearProgress sx={{ borderRadius: 4, mb: 1 }} />
              <CaptionCycler captions={PLAN_CAPTIONS} />
            </Box>
          )}
        </Box>
      )}

      {/* ── Step 3: Review plan ───────────────────────────── */}
      {step === 3 && plan && (
        <Box>
          <Typography variant="h5" fontWeight={700} mb={0.5}>Review your slide plan</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Edit titles, descriptions, types, and order before generating.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ display: "block", mb: 2, letterSpacing: 1, textTransform: "uppercase" }}>
            {plan.presentation_title}
          </Typography>

          {plan.slides?.map((slide, i) => (
            <Box key={i} sx={{
              mb: 1.25, borderRadius: 2, border: "1px solid", borderColor: "divider",
              bgcolor: "background.paper", overflow: "hidden",
            }}>
              {/* Main row */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1 }}>
                <Typography sx={{ color: "text.disabled", fontSize: 11, minWidth: 20, textAlign: "center", flexShrink: 0 }}>
                  {i + 1}
                </Typography>

                {/* Type selector */}
                <TextField select size="small" value={slide.type}
                  onChange={(e) => updateSlide(i, { type: e.target.value })}
                  sx={{ minWidth: 148, "& .MuiSelect-select": { fontSize: 12, py: 0.6 },
                    "& .MuiInputLabel-root": { fontSize: 12 } }}>
                  {SLIDE_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                          bgcolor: SLIDE_TYPE_COLORS[t.value] || "#2B3BAB" }} />
                        <Typography sx={{ fontSize: 12 }}>{t.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>

                {/* Title */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {editingTitle === i ? (
                    <TextField size="small" value={editTitleVal} fullWidth
                      onChange={(e) => setEditTitleVal(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEditTitle(i)}
                      onBlur={() => saveEditTitle(i)}
                      autoFocus sx={{ "& input": { fontSize: 13 } }} />
                  ) : (
                    <Typography variant="body2" fontWeight={500} noWrap
                      onClick={() => startEditTitle(i)}
                      sx={{ cursor: "pointer", fontSize: 13, "&:hover": { color: "primary.main" } }}>
                      {slide.title}
                    </Typography>
                  )}
                </Box>

                {/* Reorder + delete */}
                <Box sx={{ display: "flex", flexShrink: 0 }}>
                  <Tooltip title="Move up">
                    <span>
                      <IconButton size="small" onClick={() => moveSlide(i, -1)} disabled={i === 0}>
                        <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Move down">
                    <span>
                      <IconButton size="small" onClick={() => moveSlide(i, 1)} disabled={i === plan.slides.length - 1}>
                        <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Delete slide">
                    <span>
                      <IconButton size="small" onClick={() => deleteSlide(i)}
                        disabled={plan.slides.length <= 3}
                        sx={{ color: "error.main", "&:hover": { bgcolor: "error.50" } }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>

              {/* Description row */}
              <Box sx={{ px: 2, pb: 1, pt: 0, borderTop: "1px solid", borderColor: "divider" }}>
                {editingDesc === i ? (
                  <TextField size="small" fullWidth value={editDescVal}
                    onChange={(e) => setEditDescVal(e.target.value)}
                    onBlur={() => saveEditDesc(i)}
                    onKeyDown={(e) => e.key === "Enter" && saveEditDesc(i)}
                    placeholder="One-line description of what this slide covers..."
                    autoFocus
                    sx={{ mt: 0.75, "& input": { fontSize: 12 } }} />
                ) : (
                  <Typography variant="caption" color="text.secondary"
                    onClick={() => startEditDesc(i)}
                    sx={{ display: "block", mt: 0.75, cursor: "pointer", fontStyle: slide.description ? "normal" : "italic",
                      "&:hover": { color: "text.primary" } }}>
                    {slide.description || "Click to add a description…"}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}

          {/* Add slide */}
          <Button startIcon={<AddIcon />} onClick={addSlide} size="small" variant="outlined"
            sx={{ mb: 3, mt: 0.5 }}>
            Add slide
          </Button>

          {/* Slide count adjuster */}
          <Box sx={{ bgcolor: "grey.50", borderRadius: 2, p: 2, mb: 3, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="body2" fontWeight={600} mb={1.5}>
              Adjust slide count — currently {plan.slides?.length}
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
              <TextField type="number" size="small" label="Target count" value={targetCount}
                onChange={(e) => setTargetCount(Math.max(4, Math.min(30, Number(e.target.value))))}
                inputProps={{ min: 4, max: 30 }} sx={{ width: 130 }} />
              <Button variant="outlined" size="small" startIcon={replanLoading
                ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
                onClick={handleReplan} disabled={replanLoading || targetCount === plan.slides?.length}>
                {replanLoading ? "Regenerating…" : "Regenerate layout"}
              </Button>
              <Typography variant="caption" color="text.secondary">
                AI will restructure the outline to fit the new count
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setStep(2)}>Back</Button>
            <Button variant="contained" size="large" startIcon={<AutoAwesomeIcon />} onClick={handleGenerate}>
              Generate slides
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
