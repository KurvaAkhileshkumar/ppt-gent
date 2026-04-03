import React, { useEffect, useState } from "react";
import {
  Box, Typography, Grid, Card, CardActionArea,
  CardContent, Chip, Skeleton, Button,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api from "../api";

const CREATE_OPTIONS = [
  {
    label: "Single Lesson",
    description: "Generate a complete lecture presentation",
    icon: <MenuBookIcon sx={{ fontSize: 32 }} />,
    color: "#1a6b5a",
    path: "/lessons/create",
  },
  {
    label: "Lesson Series",
    description: "Plan an entire unit across multiple lectures",
    icon: <LibraryBooksIcon sx={{ fontSize: 32 }} />,
    color: "#2563eb",
    path: "/series/create",
  },
  {
    label: "Activity Sheet",
    description: "Generate a homework or in-class worksheet",
    icon: <AssignmentIcon sx={{ fontSize: 32 }} />,
    color: "#d97706",
    path: "/activity-sheets/create",
  },
];

function ResourceCard({ item, type }) {
  const navigate = useNavigate();
  const path =
    type === "lesson" ? `/lessons/${item.id}`
    : type === "series" ? `/series/${item.id}`
    : `/activity-sheets/${item.id}`;

  const statusColor = item.status === "completed" ? "success"
    : item.status === "failed" ? "error" : "warning";

  return (
    <Card>
      <CardActionArea onClick={() => navigate(path)} sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, pr: 1 }}>
            {item.title}
          </Typography>
          <Chip label={item.status} color={statusColor} size="small" />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {item.subject && `${item.subject} · `}
          {item.branch && `${item.branch} · `}
          {item.semester && `Sem ${item.semester}`}
        </Typography>
        <Typography variant="caption" color="text.disabled" mt={0.5} display="block">
          {new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </Typography>
      </CardActionArea>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [series, setSeries] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/lessons/"),
      api.get("/series/"),
      api.get("/activity-sheets/"),
    ]).then(([l, s, a]) => {
      setLessons(l.data.lessons.slice(0, 4));
      setSeries(s.data.series.slice(0, 4));
      setSheets(a.data.activity_sheets.slice(0, 4));
    }).finally(() => setLoading(false));
  }, []);

  const recentAll = [
    ...lessons.map((l) => ({ ...l, _type: "lesson" })),
    ...series.map((s) => ({ ...s, _type: "series" })),
    ...sheets.map((a) => ({ ...a, _type: "sheet" })),
  ]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: "auto" }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={800} color="text.primary">
          What shall we create today?
        </Typography>
        <Typography variant="body1" color="text.secondary" mt={0.5}>
          Welcome back, {user?.full_name?.split(" ")[0]} ✨
        </Typography>
      </Box>

      {/* Create options */}
      <Grid container spacing={2} mb={5}>
        {CREATE_OPTIONS.map((opt) => (
          <Grid item xs={12} sm={4} key={opt.label}>
            <Card
              sx={{
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
                "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" },
              }}
              onClick={() => navigate(opt.path)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: opt.color, mb: 1.5 }}>{opt.icon}</Box>
                <Typography variant="subtitle1" fontWeight={700}>{opt.label}</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>{opt.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent resources */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Recent</Typography>
        <Button size="small" onClick={() => navigate("/lessons")}>View all</Button>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
      ) : recentAll.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
          <AutoAwesomeIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
          <Typography>No resources yet. Create your first lesson above!</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {recentAll.map((item) => (
            <Grid item xs={12} sm={6} key={item.id}>
              <ResourceCard item={item} type={item._type} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
