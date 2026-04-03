import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, Grid, Card, CardActionArea,
  CardContent, Chip, Skeleton, IconButton, Menu, MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Lessons() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchor, setAnchor] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/lessons/").then((res) => setLessons(res.data.lessons)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    await api.delete(`/lessons/${selected}`);
    setLessons((prev) => prev.filter((l) => l.id !== selected));
    setAnchor(null);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Lessons</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/lessons/create")}>
          Create new
        </Button>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => <Grid item xs={12} sm={6} key={i}><Skeleton variant="rounded" height={120} /></Grid>)}
        </Grid>
      ) : lessons.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <Typography mb={2}>No lessons yet.</Typography>
          <Button variant="outlined" onClick={() => navigate("/lessons/create")}>Create your first lesson</Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {lessons.map((lesson) => (
            <Grid item xs={12} sm={6} key={lesson.id}>
              <Card>
                <Box sx={{ display: "flex", alignItems: "stretch" }}>
                  <CardActionArea sx={{ flex: 1 }} onClick={() => navigate(`/lessons/${lesson.id}`)}>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, pr: 1 }}>
                          {lesson.title}
                        </Typography>
                        <Chip
                          label={lesson.status}
                          size="small"
                          color={lesson.status === "completed" ? "success" : lesson.status === "failed" ? "error" : "warning"}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {[lesson.subject, lesson.branch, lesson.semester && `Sem ${lesson.semester}`, lesson.slide_count && `${lesson.slide_count} slides`].filter(Boolean).join(" · ")}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(lesson.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                  <Box sx={{ display: "flex", alignItems: "center", pr: 1 }}>
                    <IconButton size="small" onClick={(e) => { setAnchor(e.currentTarget); setSelected(lesson.id); }}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>Delete</MenuItem>
      </Menu>
    </Box>
  );
}
