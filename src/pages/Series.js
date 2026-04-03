import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, Grid, Card, CardActionArea,
  CardContent, Chip, Skeleton, CircularProgress, Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

// ── Series List ───────────────────────────────────────────────
export function SeriesList() {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/series/").then((res) => setSeries(res.data.series)).finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Lesson series</Typography>
          <Typography variant="body2" color="text.secondary">Multiple lessons on complex topics.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/series/create")}>
          Create new
        </Button>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[1, 2].map((i) => <Grid item xs={12} sm={6} key={i}><Skeleton variant="rounded" height={120} /></Grid>)}
        </Grid>
      ) : series.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <Typography mb={2}>No lesson series yet.</Typography>
          <Button variant="outlined" onClick={() => navigate("/series/create")}>Create your first series</Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {series.map((s) => (
            <Grid item xs={12} sm={6} key={s.id}>
              <Card>
                <CardActionArea onClick={() => navigate(`/series/${s.id}`)}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, pr: 1 }}>{s.title}</Typography>
                      <Chip label={s.status} size="small"
                        color={s.status === "completed" ? "success" : s.status === "failed" ? "error" : "warning"} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {[s.subject, s.branch, s.semester && `Sem ${s.semester}`, `${s.lesson_count} lessons`].filter(Boolean).join(" · ")}
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

// ── Series Detail ─────────────────────────────────────────────
export function SeriesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    api.get(`/series/${id}`).then((res) => setSeries(res.data.series)).finally(() => setLoading(false));
  }, [id]);

  const handleExport = async (lessonId, title) => {
    setExporting(lessonId);
    try {
      const res = await api.get(`/lessons/${lessonId}/export/pptx`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.pptx`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}><CircularProgress /></Box>;
  if (!series) return <Alert severity="error" sx={{ m: 4 }}>Series not found</Alert>;

  return (
    <Box sx={{ p: 4, maxWidth: 900, mx: "auto" }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/series")} sx={{ mb: 2 }}>Back</Button>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{series.title}</Typography>
        <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
          {series.subject && <Chip label={series.subject} size="small" />}
          {series.branch && <Chip label={series.branch} size="small" />}
          {series.semester && <Chip label={`Sem ${series.semester}`} size="small" />}
          <Chip label={`${series.lesson_count} lessons`} size="small" variant="outlined" />
          <Chip label={series.status} size="small" color={series.status === "completed" ? "success" : "warning"} />
        </Box>
      </Box>

      <Grid container spacing={2}>
        {(series.lessons || []).map((lesson, i) => (
          <Grid item xs={12} key={lesson.id}>
            <Card>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Chip label={`${i + 1}`} color="primary" size="small" />
                <Box sx={{ flex: 1, cursor: "pointer" }} onClick={() => navigate(`/lessons/${lesson.id}`)}>
                  <Typography variant="subtitle1" fontWeight={700}>{lesson.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lesson.slide_count} slides · {lesson.status}
                  </Typography>
                </Box>
                {lesson.status === "completed" && (
                  <Button
                    size="small" variant="outlined" startIcon={<DownloadIcon />}
                    disabled={exporting === lesson.id}
                    onClick={() => handleExport(lesson.id, lesson.title)}
                  >
                    {exporting === lesson.id ? "..." : "PPTX"}
                  </Button>
                )}
                {lesson.status === "generating" && <CircularProgress size={20} />}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
