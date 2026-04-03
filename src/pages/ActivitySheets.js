import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, Grid, Card, CardActionArea, CardContent,
  Chip, Skeleton, TextField, MenuItem, CircularProgress, Alert,
  Divider, Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "CHEM", "OTHER"];
const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

// ── Activity Sheets List ──────────────────────────────────────
export function ActivitySheetList() {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/activity-sheets/").then((r) => setSheets(r.data.activity_sheets)).finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Activity sheets</Typography>
          <Typography variant="body2" color="text.secondary">Create print-ready activities for students.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/activity-sheets/create")}>
          Create new
        </Button>
      </Box>

      {loading ? (
        <Grid container spacing={2}>{[1, 2].map((i) => <Grid size={{ xs: 12, sm: 6 }} key={i}><Skeleton variant="rounded" height={100} /></Grid>)}</Grid>
      ) : sheets.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <Typography mb={2}>No activity sheets yet.</Typography>
          <Button variant="outlined" onClick={() => navigate("/activity-sheets/create")}>Create your first sheet</Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {sheets.map((s) => (
            <Grid size={{ xs: 12, sm: 6 }} key={s.id}>
              <Card>
                <CardActionArea onClick={() => navigate(`/activity-sheets/${s.id}`)}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, pr: 1 }}>{s.title}</Typography>
                      <Chip label={s.status} size="small" color={s.status === "completed" ? "success" : s.status === "failed" ? "error" : "warning"} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {[s.subject, s.branch, s.semester && `Sem ${s.semester}`].filter(Boolean).join(" · ")}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

// ── Create Activity Sheet ─────────────────────────────────────
export function CreateActivitySheet() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    topic: "", subject: "", branch: "", semester: "", university: "", additional_instructions: "",
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/activity-sheets/", form);
      navigate(`/activity-sheets/${res.data.activity_sheet.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Generation failed");
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 680, mx: "auto" }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/activity-sheets")} sx={{ mb: 3 }}>Back</Button>

      <Typography variant="h5" fontWeight={700} mb={0.5}>Create activity sheet</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Generate a homework or in-class worksheet</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField label="Topic" fullWidth required autoFocus value={form.topic} onChange={set("topic")}
            placeholder="e.g. Bellman-Ford Algorithm" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Subject" fullWidth value={form.subject} onChange={set("subject")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="University" fullWidth value={form.university} onChange={set("university")} />
        </Grid>
        <Grid size={6}>
          <TextField select label="Branch" fullWidth value={form.branch} onChange={set("branch")}>
            <MenuItem value=""><em>Any</em></MenuItem>
            {BRANCHES.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={6}>
          <TextField select label="Semester" fullWidth value={form.semester} onChange={set("semester")}>
            <MenuItem value=""><em>Any</em></MenuItem>
            {SEMESTERS.map((s) => <MenuItem key={s} value={s}>Sem {s}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={12}>
          <TextField label="Additional instructions (optional)" fullWidth multiline rows={3}
            value={form.additional_instructions} onChange={set("additional_instructions")} />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" size="large" disabled={loading || !form.topic.trim()}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
          onClick={handleGenerate}>
          {loading ? "Generating..." : "Generate sheet"}
        </Button>
      </Box>
    </Box>
  );
}

// ── Activity Sheet Viewer ─────────────────────────────────────
function renderQuestion(q, idx) {
  if (q.type === "match") {
    return (
      <Box key={idx} mb={2}>
        <Typography variant="body2" color="text.secondary" mb={1}>Match the following:</Typography>
        <Grid container spacing={1}>
          <Grid size={5}>
            {q.terms?.map((t, i) => (
              <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>{i + 1}. {t}</Typography>
            ))}
          </Grid>
          <Grid size={2} />
          <Grid size={5}>
            {q.definitions?.map((d, i) => (
              <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                {String.fromCharCode(97 + i)}) {d}
              </Typography>
            ))}
          </Grid>
        </Grid>
      </Box>
    );
  }

  const lines = q.answer_lines || 3;
  return (
    <Box key={idx} mb={2.5}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
          {idx + 1}. {q.question}
        </Typography>
        {q.marks && <Chip label={`${q.marks} marks`} size="small" sx={{ ml: 1 }} />}
      </Box>
      <Box sx={{ mt: 1 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <Divider key={i} sx={{ my: 0.8, borderStyle: "dashed", borderColor: "#ccc" }} />
        ))}
      </Box>
    </Box>
  );
}

export function ActivitySheetViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/activity-sheets/${id}`).then((r) => setSheet(r.data.activity_sheet)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}><CircularProgress /></Box>;
  if (!sheet) return <Alert severity="error" sx={{ m: 4 }}>Sheet not found</Alert>;

  const content = sheet.content_json;

  return (
    <Box sx={{ p: 4, maxWidth: 900, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/activity-sheets")} sx={{ mb: 1 }}>Back</Button>
          <Typography variant="h5" fontWeight={700}>{sheet.title}</Typography>
          <Box display="flex" gap={1} mt={0.5}>
            {sheet.subject && <Chip label={sheet.subject} size="small" />}
            {sheet.branch && <Chip label={sheet.branch} size="small" />}
            {sheet.semester && <Chip label={`Sem ${sheet.semester}`} size="small" />}
            <Chip label={sheet.status} size="small" color={sheet.status === "completed" ? "success" : "warning"} />
          </Box>
        </Box>
      </Box>

      {sheet.status === "generating" && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Generating your activity sheet...</Typography>
        </Box>
      )}

      {sheet.status === "completed" && content && (
        <Paper sx={{ p: 4, maxWidth: 720, mx: "auto" }} elevation={2}>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">Name: ________________________</Typography>
            <Typography variant="body2">Date: ________________________</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="h5" fontWeight={700} color="primary" mb={0.5}>
            {content.title}
          </Typography>

          {(content.sections || []).map((section, si) => (
            <Box key={si} mb={3}>
              <Typography variant="h6" fontWeight={700} color="primary" mb={0.5}>
                {section.section_title}
              </Typography>
              {section.instructions && (
                <Typography variant="body2" color="text.secondary" mb={1.5}>
                  {section.instructions}
                </Typography>
              )}
              {(section.questions || []).map((q, qi) => renderQuestion(q, qi))}
            </Box>
          ))}
        </Paper>
      )}

      {sheet.status === "failed" && (
        <Alert severity="error">{sheet.error_message || "Generation failed"}</Alert>
      )}
    </Box>
  );
}
