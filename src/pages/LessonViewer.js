import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";

import {

  Box, Typography, Button, Chip, CircularProgress,

  Alert, Paper, IconButton, Tooltip, MenuItem,

  TextField, LinearProgress, Grid, Skeleton,

} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import DownloadIcon from "@mui/icons-material/Download";

import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import GridViewIcon from "@mui/icons-material/GridView";

import ViewCarouselIcon from "@mui/icons-material/ViewCarousel";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import PaletteIcon from "@mui/icons-material/Palette";

import { useParams, useNavigate, useLocation } from "react-router-dom";

import katex from "katex";

import api from "../api";



// â"€â"€ Theme palette definitions â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const THEME_PALETTE = {

  dark:     { bg: "#1A2038", title: "#F0C040", body: "#C8D4F0", accent: "#F0C040", codeBg: "#0D1525", codeText: "#6EE77A", border: "#252E50", quizBg: "#141A30" },

  light:    { bg: "#FFFFFF", title: "#1A2038", body: "#383E58", accent: "#4361EE", codeBg: "#F3F4F8", codeText: "#1A2038", border: "#E0E4F0", quizBg: "#F0F3FF" },

  simple:   { bg: "#FAFAFA", title: "#1A1A1A", body: "#444444", accent: "#333333", codeBg: "#EFEFEF", codeText: "#1A1A1A", border: "#DCDCDC", quizBg: "#F3F3F3" },

  ocean:    { bg: "#0B2233", title: "#00D4C8", body: "#A8DDD8", accent: "#00D4C8", codeBg: "#071420", codeText: "#40FFEA", border: "#163347", quizBg: "#091B28" },

  saffron:  { bg: "#271508", title: "#FF9933", body: "#F0D4AA", accent: "#FF9933", codeBg: "#180D04", codeText: "#FFD080", border: "#3E2010", quizBg: "#1E1005" },

  midnight: { bg: "#06060E", title: "#5B8DEF", body: "#B8C4E0", accent: "#5B8DEF", codeBg: "#02020A", codeText: "#8AB4FF", border: "#151830", quizBg: "#030309" },

};



const THEME_OPTIONS = [

  { value: "dark", label: "Dark" }, { value: "light", label: "Light" },

  { value: "simple", label: "Simple" }, { value: "ocean", label: "Ocean" },

  { value: "saffron", label: "Saffron" }, { value: "midnight", label: "Midnight" },

];



const SLIDE_TYPE_LABELS = {

  title: "Title", learning_objectives: "Objectives", vocabulary: "Vocabulary",

  content: "Content", quiz: "Quiz", quiz_answer: "Answer",

  summary: "Summary", references: "References",

  hook: "Hook", concept_card: "Concept", steps: "Steps",

  myth_bust: "Myth Bust", analogy: "Analogy", big_stat: "Stat", comparison: "Compare",

  true_false: "True/False",

};



const SLIDE_TYPE_COLORS = {

  title: "#4361EE", learning_objectives: "#7B5EA7", vocabulary: "#0E7C61",

  content: "#4361EE", quiz: "#D4891A", quiz_answer: "#2E7D32",

  summary: "#37474F", references: "#546E7A",

  hook: "#E63946", concept_card: "#7B5EA7", steps: "#0077B6",

  myth_bust: "#C1121F", analogy: "#2D6A4F", big_stat: "#E76F51", comparison: "#457B9D",

  true_false: "#D4891A",

};



const GEN_CAPTIONS = [

  "Writing slides in parallel — faster than a grad student on caffeine",

  "Converting your syllabus into something students will actually look at",

  "Running 8 parallel writer agents so you don't have to wait",

  "Teaching the AI to not say 'as we can clearly see'",

  "Removing every em dash — permanently",

  "Generating diagrams for slides that actually need them",

  "Checking technical accuracy one slide at a time",

  "Almost there — final slides coming through",

];



function useCaptionCycler(captions, interval = 3200) {

  const [idx, setIdx] = useState(0);

  useEffect(() => {

    const t = setInterval(() => setIdx((p) => (p + 1) % captions.length), interval);

    return () => clearInterval(t);

  }, [captions, interval]);

  return captions[idx];

}



// â"€â"€ Block renderers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

// Detects inline LaTeX: $...$ , \(...\) , or bare \cmd{} expressions like \frac, \sqrt, \sum etc.

const BARE_LATEX_RE = /\\(?:frac|sqrt|sum|int|prod|lim|partial|infty|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|omega|Omega|nabla|cdot|times|leq|geq|neq|approx|propto|rightarrow|leftarrow|Rightarrow|in|notin|subset|forall|exists|pm|div|hat|bar|vec|dot|ddot|tilde|text|mathrm|mathbf|overline|underbrace|overbrace)\b/;



function InlineLatexText({ text }) {

  if (!text) return null;

  const str = String(text);

  // If the whole string looks like a raw LaTeX expression with no delimiters, render it directly

  if (!str.includes("$") && !str.includes("\\(") && BARE_LATEX_RE.test(str)) {

    try {

      const html = katex.renderToString(str, { displayMode: false, throwOnError: false, output: "html" });

      return <span dangerouslySetInnerHTML={{ __html: html }} />;

    } catch {

      return <>{str}</>;

    }

  }

  const parts = [];

  const regex = /\\\((.+?)\\\)|\$([^$\n]+?)\$/g;

  let last = 0;

  let m;

  while ((m = regex.exec(str)) !== null) {

    if (m.index > last) parts.push({ t: "text", v: str.slice(last, m.index) });

    parts.push({ t: "latex", v: m[1] || m[2] });

    last = m.index + m[0].length;

  }

  if (last < str.length) parts.push({ t: "text", v: str.slice(last) });

  if (parts.length === 0 || (parts.length === 1 && parts[0].t === "text")) return <>{str}</>;

  return (

    <>

      {parts.map((part, i) => {

        if (part.t === "text") return <span key={i}>{part.v}</span>;

        try {

          const html = katex.renderToString(part.v, { displayMode: false, throwOnError: false, output: "html" });

          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;

        } catch {

          return <span key={i}>{part.v}</span>;

        }

      })}

    </>

  );

}



function TextBlock({ value, p }) {

  return (

    <Typography component="div" variant="body2" sx={{ color: p.body, mb: 1.5, lineHeight: 1.75, fontSize: 14 }}>

      <InlineLatexText text={String(value || "")} />

    </Typography>

  );

}



function ListBlock({ value, p }) {

  const items = Array.isArray(value) ? value : String(value).split("\n").filter(Boolean);

  return (

    <Box sx={{ mb: 1.5 }}>

      {items.map((item, i) => (

        <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, mb: 0.6 }}>

          <Box sx={{ flexShrink: 0, mt: "6px", width: 6, height: 6, borderRadius: "50%", bgcolor: p.accent }} />

          <Typography component="div" variant="body2" sx={{ color: p.body, lineHeight: 1.65, fontSize: 14 }}>

            <InlineLatexText text={String(item)} />

          </Typography>

        </Box>

      ))}

    </Box>

  );

}



function CodeBlock({ value, language, p }) {

  return (

    <Box sx={{ bgcolor: p.codeBg, borderRadius: 2, p: 2, mb: 1.5, overflowX: "auto", position: "relative" }}>

      {language && (

        <Typography sx={{ position: "absolute", top: 8, right: 12, fontSize: 10, color: p.codeText, opacity: 0.45, fontFamily: "monospace", textTransform: "uppercase" }}>

          {language}

        </Typography>

      )}

      <Typography component="pre" sx={{ color: p.codeText, fontFamily: "'Fira Code','Courier New',monospace", fontSize: 12.5, m: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>

        {value}

      </Typography>

    </Box>

  );

}



function TableBlock({ headers, rows, p }) {

  return (

    <Box sx={{ mb: 1.5, borderRadius: 2, border: `1px solid ${p.border}`, overflow: "hidden" }}>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>

        <thead>

          <tr>

            {headers?.map((h, j) => (

              <th key={j} style={{ padding: "8px 14px", background: p.accent, color: p.bg, textAlign: "left", fontSize: 12, fontWeight: 700 }}>{h}</th>

            ))}

          </tr>

        </thead>

        <tbody>

          {rows?.map((row, ri) => (

            <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : `${p.border}60` }}>

              {row.map((cell, ci) => (

                <td key={ci} style={{ padding: "7px 14px", color: p.body, fontSize: 12.5, borderBottom: `1px solid ${p.border}` }}>{cell}</td>

              ))}

            </tr>

          ))}

        </tbody>

      </table>

    </Box>

  );

}



function FormulaBlock({ value, display, p }) {

  const html = useMemo(() => {

    try {

      return katex.renderToString(String(value), { displayMode: !!display, throwOnError: false, output: "html" });

    } catch { return String(value); }

  // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [value, display]);

  return (

    <Box sx={{

      mb: 1.5, px: display ? 2 : 0, py: display ? 1.5 : 0,

      bgcolor: display ? `${p.border}40` : "transparent",

      borderRadius: display ? 2 : 0, textAlign: display ? "center" : "left",

      color: p.body, overflow: "auto",

      "& .katex": { color: p.body },

    }}

      dangerouslySetInnerHTML={{ __html: html }}

    />

  );

}



function renderBlock(block, i, p) {

  if (!block) return null;

  switch (block.type) {

    case "text":    return <TextBlock key={i} value={block.value} p={p} />;

    case "list":    return <ListBlock key={i} value={block.value} p={p} />;

    case "code":    return <CodeBlock key={i} value={block.value} language={block.language} p={p} />;

    case "table":   return <TableBlock key={i} headers={block.headers} rows={block.rows} p={p} />;

    case "formula": return <FormulaBlock key={i} value={block.value} display={block.display} p={p} />;

    default: return null;

  }

}



// â"€â"€ Slide type renderers (height: 100% for fixed 16:9 frame) â"€

function TitleSlide({ slide, p }) {

  return (

    <Box sx={{ minHeight: 517, bgcolor: p.bg, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", p: "6% 8%", position: "relative" }}>

      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, bgcolor: p.accent }} />

      <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, bgcolor: p.accent, opacity: 0.3 }} />

      <Typography sx={{ color: p.title, fontWeight: 800, fontSize: "clamp(18px, 3.5vw, 34px)", lineHeight: 1.2, mb: 2 }}>{slide.title}</Typography>

      {slide.subtitle && <Typography sx={{ color: p.body, opacity: 0.75, fontSize: "clamp(12px, 1.8vw, 18px)", maxWidth: 500, lineHeight: 1.5 }}>{slide.subtitle}</Typography>}

    </Box>

  );

}



function ObjectivesSlide({ slide, p }) {

  const block = slide.content?.find(b => b.type === "list");

  const items = block ? (Array.isArray(block.value) ? block.value : String(block.value).split("\n").filter(Boolean)) : [];

  return (

    <Box sx={{ minHeight: 517, bgcolor: p.bg, p: "4% 5%", overflow: "visible", display: "flex", flexDirection: "column" }}>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: "3%", flexShrink: 0 }}>

        <Box sx={{ width: 4, height: "2em", borderRadius: 4, bgcolor: p.accent }} />

        <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(14px, 2vw, 22px)" }}>{slide.title}</Typography>

      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5%", flex: 1, overflow: "visible" }}>

        {items.slice(0, 6).map((obj, i) => (

          <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: "2%", p: "1.5% 2%", borderRadius: 2, bgcolor: `${p.accent}18`, border: `1px solid ${p.accent}30`, flexShrink: 0 }}>

            <Box sx={{ flexShrink: 0, bgcolor: p.accent, color: p.bg, borderRadius: 1, minWidth: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{i + 1}</Box>

            <Typography sx={{ color: p.body, lineHeight: 1.55, fontSize: "clamp(11px, 1.3vw, 14px)" }}>{obj}</Typography>

          </Box>

        ))}

      </Box>

    </Box>

  );

}



function QuizSlide({ slide, p }) {

  const question = slide.content?.find(b => b.type === "text")?.value || "";

  const optBlock = slide.content?.find(b => b.type === "list");

  const opts = optBlock ? (Array.isArray(optBlock.value) ? optBlock.value : String(optBlock.value).split("\n").filter(Boolean)) : [];

  const optColors = ["#4361EE", "#7B5EA7", "#0E7C61", "#D4891A"];

  return (

    <Box sx={{ minHeight: 517, bgcolor: p.bg, p: "4% 5%", overflow: "visible", display: "flex", flexDirection: "column" }}>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: "2.5%", flexShrink: 0 }}>

        <Box sx={{ bgcolor: "#D4891A", color: "#fff", px: 1.25, py: 0.3, borderRadius: 1, fontSize: 10, fontWeight: 700 }}>QUIZ</Box>

        <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(12px, 1.8vw, 18px)" }}>{slide.title}</Typography>

      </Box>

      <Box sx={{ bgcolor: p.quizBg, borderRadius: 2, p: "2.5% 3%", mb: "2.5%", border: `1px solid ${p.border}`, flexShrink: 0 }}>

        <Typography sx={{ color: p.body, fontWeight: 600, lineHeight: 1.6, fontSize: "clamp(11px, 1.3vw, 14px)" }}>{question}</Typography>

      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5%", flex: 1, overflow: "visible" }}>

        {opts.slice(0, 4).map((opt, i) => (

          <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: "2%", p: "1.5% 2%", borderRadius: 2, border: `1px solid ${optColors[i]}35`, bgcolor: `${optColors[i]}12`, flexShrink: 0 }}>

            <Box sx={{ flexShrink: 0, bgcolor: optColors[i], color: "#fff", borderRadius: 1, minWidth: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>

              {String.fromCharCode(65 + i)}

            </Box>

            <Typography sx={{ color: p.body, lineHeight: 1.55, fontSize: "clamp(11px, 1.3vw, 14px)" }}>{opt.replace(/^[A-D][.)]\s*/, "")}</Typography>

          </Box>

        ))}

      </Box>

    </Box>

  );

}



function QuizAnswerSlide({ slide, p }) {

  return (

    <Box sx={{ minHeight: 517, bgcolor: p.bg, p: "4% 5%", overflow: "visible", display: "flex", flexDirection: "column" }}>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: "3%", flexShrink: 0 }}>

        <Box sx={{ bgcolor: "#2E7D32", color: "#fff", px: 1.25, py: 0.3, borderRadius: 1, fontSize: 10, fontWeight: 700 }}>ANSWER</Box>

        <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(12px, 1.8vw, 18px)" }}>{slide.title}</Typography>

      </Box>

      {(slide.content || []).map((block, i) => {

        if (i === 0) return (

          <Box key={i} sx={{ bgcolor: "#2E7D3222", border: "1px solid #2E7D3245", borderRadius: 2, p: "2% 3%", mb: "2.5%", flexShrink: 0 }}>

            <Typography sx={{ color: p.body, fontWeight: 600, fontSize: "clamp(11px, 1.3vw, 14px)" }}>{block.value}</Typography>

          </Box>

        );

        return <Box key={i} sx={{ flex: i === (slide.content.length - 1) ? 1 : 0, overflow: "hidden" }}>{renderBlock(block, i, p)}</Box>;

      })}

    </Box>

  );

}



function SummarySlide({ slide, p }) {

  const listBlock = slide.content?.find(b => b.type === "list");

  const textBlock = slide.content?.find(b => b.type === "text");

  const items = listBlock

    ? (Array.isArray(listBlock.value) ? listBlock.value : String(listBlock.value).split("\n").filter(Boolean))

    : [];

  return (

    <Box sx={{ minHeight: 517, bgcolor: p.bg, p: "4% 5%", overflow: "visible", display: "flex", flexDirection: "column" }}>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: "2%", flexShrink: 0 }}>

        <Box sx={{ width: 4, height: "2em", borderRadius: 4, bgcolor: p.accent }} />

        <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(14px, 2vw, 22px)" }}>{slide.title}</Typography>

      </Box>

      {textBlock && (

        <Typography sx={{ color: p.body, opacity: 0.65, mb: "2%", fontSize: "clamp(10px, 1.2vw, 13px)", fontStyle: "italic", flexShrink: 0 }}>{textBlock.value}</Typography>

      )}

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5%", flex: 1, overflow: "visible" }}>

        {items.slice(0, 8).map((point, i) => (

          <Box key={i} sx={{ display: "flex", gap: "3%", p: "2.5% 3%", borderRadius: 2, bgcolor: `${p.border}45`, alignItems: "flex-start", overflow: "hidden" }}>

            <Typography sx={{ color: p.accent, fontWeight: 800, fontSize: "clamp(13px, 1.5vw, 17px)", lineHeight: 1.2, flexShrink: 0 }}>{i + 1}</Typography>

            <Typography sx={{ color: p.body, lineHeight: 1.5, fontSize: "clamp(10px, 1.1vw, 12.5px)" }}>{point}</Typography>

          </Box>

        ))}

      </Box>

    </Box>

  );

}



function GenericSlide({ slide, p }) {

  const content = slide.content || [];

  const contentBlocks = <Box sx={{ flex: 1, minWidth: 0, overflow: "visible" }}>{content.map((b, i) => renderBlock(b, i, p))}</Box>;

  return (

    <Box sx={{ minHeight: 517, bgcolor: p.bg, p: "4% 5%", overflow: "visible", display: "flex", flexDirection: "column" }}>

      <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(14px, 2vw, 22px)", mb: "1.5%", flexShrink: 0 }}>{slide.title}</Typography>

      <Box sx={{ width: 40, height: 3, borderRadius: 4, bgcolor: p.accent, mb: "2.5%", flexShrink: 0 }} />

      {slide.image_b64 ? (

        <Box sx={{ display: "flex", gap: "3%", flex: 1, overflow: "visible", alignItems: "stretch" }}>

          {contentBlocks}

          <Box sx={{

            flexShrink: 0, width: "36%", overflow: "hidden", borderRadius: 1,

            border: `1px solid ${p.border}`,

            backgroundImage: `url(data:image/png;base64,${slide.image_b64})`,

            backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center",

          }} />

        </Box>

      ) : (

        <Box sx={{ flex: 1, overflow: "visible" }}>{contentBlocks}</Box>

      )}

    </Box>

  );

}



function HookSlide({ slide, p }) {
  const textBlock = slide.content?.find(b => b.type === "text");
  const listBlock = slide.content?.find(b => b.type === "list");
  const bridgeBlock = slide.content?.filter(b => b.type === "text")[1];
  const items = listBlock ? (Array.isArray(listBlock.value) ? listBlock.value : String(listBlock.value).split("\n").filter(Boolean)) : [];
  return (
    <Box sx={{ minHeight: 517, bgcolor: p.bg, display: "flex", flexDirection: "column", overflow: "visible" }}>
      <Box sx={{ height: 4, bgcolor: "#E63946", flexShrink: 0 }} />
      <Box sx={{ flex: 1, display: "flex", flexDirection: slide.image_b64 ? "row" : "column", p: "4% 5%", gap: "3%" }}>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, mb: "3%", flexShrink: 0 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#E63946" }} />
            <Typography sx={{ color: "#E63946", fontWeight: 800, fontSize: "clamp(10px, 1.1vw, 12px)", textTransform: "uppercase", letterSpacing: 1.5 }}>Why This Matters</Typography>
          </Box>
          <Typography sx={{ color: p.title, fontWeight: 800, fontSize: "clamp(16px, 2.4vw, 28px)", lineHeight: 1.2, mb: "4%", flexShrink: 0 }}>{slide.title}</Typography>
          {textBlock && <Typography sx={{ color: p.body, fontSize: "clamp(12px, 1.4vw, 15px)", lineHeight: 1.6, mb: "4%", opacity: 0.9, flexShrink: 0 }}>{textBlock.value}</Typography>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: "2%", flexShrink: 0 }}>
            {items.map((item, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: "2%", p: "1.5% 2%", borderRadius: 2, bgcolor: `#E6394615`, border: `1px solid #E6394630` }}>
                <Box sx={{ flexShrink: 0, bgcolor: "#E63946", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, mt: "1px" }}>{i + 1}</Box>
                <Typography sx={{ color: p.body, fontSize: "clamp(11px, 1.2vw, 13px)", lineHeight: 1.5 }}>{item}</Typography>
              </Box>
            ))}
          </Box>
          {bridgeBlock && <Typography sx={{ color: p.accent, fontStyle: "italic", fontSize: "clamp(10px, 1.1vw, 12px)", mt: "4%", opacity: 0.8, flexShrink: 0 }}>{bridgeBlock.value}</Typography>}
        </Box>
        {slide.image_b64 && (
          <Box sx={{ flexShrink: 0, width: "38%", borderRadius: 2, overflow: "hidden", backgroundImage: `url(data:image/png;base64,${slide.image_b64})`, backgroundSize: "cover", backgroundPosition: "center", minHeight: 200 }} />
        )}
      </Box>
    </Box>
  );
}

function ConceptCardSlide({ slide, p }) {
  const cardsBlock = slide.content?.find(b => b.type === "cards");
  const textBlock = slide.content?.find(b => b.type === "text");
  const cards = cardsBlock ? (Array.isArray(cardsBlock.value) ? cardsBlock.value : []) : [];
  return (
    <Box sx={{ minHeight: 517, bgcolor: p.bg, p: "4% 5%", display: "flex", flexDirection: "column", overflow: "visible" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: "2%", flexShrink: 0 }}>
        <Box sx={{ width: 4, height: "2em", borderRadius: 4, bgcolor: p.accent }} />
        <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(14px, 2vw, 22px)" }}>{slide.title}</Typography>
      </Box>
      {textBlock && <Typography sx={{ color: p.body, opacity: 0.7, fontSize: "clamp(10px, 1.2vw, 13px)", mb: "3%", flexShrink: 0 }}>{textBlock.value}</Typography>}
      <Box sx={{ display: "flex", gap: "2.5%", flex: 1, alignItems: "stretch" }}>
        {cards.map((card, i) => (
          <Box key={i} sx={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: 2, border: `1px solid ${p.border}`, overflow: "hidden", bgcolor: `${p.accent}08` }}>
            <Box sx={{ height: 4, bgcolor: p.accent, opacity: 0.6 + i * 0.2 }} />
            <Box sx={{ p: "6% 5%", display: "flex", flexDirection: "column", flex: 1 }}>
              <Typography sx={{ fontSize: "clamp(22px, 2.8vw, 32px)", mb: "4%", lineHeight: 1 }}>{card.emoji || "💡"}</Typography>
              <Box sx={{ bgcolor: p.accent, color: p.bg, borderRadius: 1, px: 1.25, py: 0.4, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, display: "inline-flex", mb: "3%", alignSelf: "flex-start" }}>{i + 1}</Box>
              <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(12px, 1.5vw, 16px)", lineHeight: 1.3, mb: "3%", flexShrink: 0 }}>{card.heading}</Typography>
              <Typography sx={{ color: p.body, fontSize: "clamp(10px, 1.1vw, 12.5px)", lineHeight: 1.6, opacity: 0.9 }}>{card.body}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function StepsSlide({ slide, p }) {
  const stepsBlock = slide.content?.find(b => b.type === "steps");
  const textBlock = slide.content?.find(b => b.type === "text");
  const steps = stepsBlock ? (Array.isArray(stepsBlock.value) ? stepsBlock.value : []) : [];
  return (
    <Box sx={{ minHeight: 517, bgcolor: p.bg, p: "4% 5%", display: "flex", flexDirection: "column", overflow: "visible" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: "2%", flexShrink: 0 }}>
        <Box sx={{ width: 4, height: "2em", borderRadius: 4, bgcolor: p.accent }} />
        <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(14px, 2vw, 22px)" }}>{slide.title}</Typography>
      </Box>
      {textBlock && <Typography sx={{ color: p.body, opacity: 0.7, fontSize: "clamp(10px, 1.2vw, 13px)", mb: "4%", flexShrink: 0 }}>{textBlock.value}</Typography>}
      <Box sx={{ display: "flex", alignItems: "stretch", flex: 1, gap: 0 }}>
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: 2, border: `1px solid ${p.border}`, p: "3% 3%", bgcolor: `${p.accent}0A`, position: "relative" }}>
              <Box sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: p.accent, color: p.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, mb: "8%", flexShrink: 0 }}>{i + 1}</Box>
              <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(11px, 1.4vw, 15px)", lineHeight: 1.3, mb: "4%", flexShrink: 0 }}>{s.step}</Typography>
              <Typography sx={{ color: p.body, fontSize: "clamp(9px, 1.1vw, 12px)", lineHeight: 1.55, opacity: 0.85 }}>{s.description}</Typography>
            </Box>
            {i < steps.length - 1 && (
              <Box sx={{ display: "flex", alignItems: "center", px: "0.5%", flexShrink: 0 }}>
                <Typography sx={{ color: p.accent, fontSize: "clamp(14px, 2vw, 22px)", fontWeight: 700, opacity: 0.6 }}>→</Typography>
              </Box>
            )}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
}

function MythBustSlide({ slide, p }) {
  const mythBlock = slide.content?.find(b => b.type === "myth");
  const realityBlock = slide.content?.find(b => b.type === "reality");
  const listBlock = slide.content?.find(b => b.type === "list");
  const items = listBlock ? (Array.isArray(listBlock.value) ? listBlock.value : String(listBlock.value).split("\n").filter(Boolean)) : [];
  return (
    <Box sx={{ minHeight: 517, bgcolor: p.bg, p: "4% 5%", display: "flex", flexDirection: "column", overflow: "visible" }}>
      <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(14px, 2vw, 22px)", mb: "3%", flexShrink: 0 }}>{slide.title}</Typography>
      {mythBlock && (
        <Box sx={{ borderRadius: 2, border: "1px solid #C1121F50", bgcolor: "#C1121F12", p: "2.5% 3%", mb: "2%", display: "flex", alignItems: "flex-start", gap: 1.5, flexShrink: 0 }}>
          <Typography sx={{ fontSize: "clamp(16px, 2vw, 22px)", flexShrink: 0, lineHeight: 1 }}>❌</Typography>
          <Box>
            <Typography sx={{ color: "#C1121F", fontWeight: 700, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, mb: 0.5 }}>Common Misconception</Typography>
            <Typography sx={{ color: p.body, fontSize: "clamp(11px, 1.3vw, 14px)", lineHeight: 1.5, fontStyle: "italic" }}>{mythBlock.value}</Typography>
          </Box>
        </Box>
      )}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", my: "1%", flexShrink: 0 }}>
        <Typography sx={{ color: p.body, opacity: 0.3, fontSize: 18 }}>↓</Typography>
      </Box>
      {realityBlock && (
        <Box sx={{ borderRadius: 2, border: "1px solid #2D6A4F50", bgcolor: "#2D6A4F12", p: "2.5% 3%", mb: "3%", display: "flex", alignItems: "flex-start", gap: 1.5, flexShrink: 0 }}>
          <Typography sx={{ fontSize: "clamp(16px, 2vw, 22px)", flexShrink: 0, lineHeight: 1 }}>✅</Typography>
          <Box>
            <Typography sx={{ color: "#2D6A4F", fontWeight: 700, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, mb: 0.5 }}>The Reality</Typography>
            <Typography sx={{ color: p.body, fontSize: "clamp(11px, 1.3vw, 14px)", lineHeight: 1.5, fontWeight: 500 }}>{realityBlock.value}</Typography>
          </Box>
        </Box>
      )}
      {items.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "1.5%" }}>
          {items.map((item, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Box sx={{ flexShrink: 0, mt: "5px", width: 6, height: 6, borderRadius: "50%", bgcolor: p.accent }} />
              <Typography sx={{ color: p.body, fontSize: "clamp(10px, 1.2vw, 13px)", lineHeight: 1.5 }}>{item}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function BigStatSlide({ slide, p }) {
  const statBlock = slide.content?.find(b => b.type === "stat");
  const textBlocks = slide.content?.filter(b => b.type === "text") || [];
  const listBlock = slide.content?.find(b => b.type === "list");
  const items = listBlock ? (Array.isArray(listBlock.value) ? listBlock.value : String(listBlock.value).split("\n").filter(Boolean)) : [];
  return (
    <Box sx={{ minHeight: 517, bgcolor: p.bg, display: "flex", flexDirection: slide.image_b64 ? "row" : "column", overflow: "visible" }}>
      <Box sx={{ flex: 1, p: "4% 5%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(13px, 1.6vw, 18px)", mb: "4%", flexShrink: 0 }}>{slide.title}</Typography>
        {statBlock && (
          <Box sx={{ mb: "4%", flexShrink: 0 }}>
            <Typography sx={{ color: p.accent, fontWeight: 900, fontSize: "clamp(48px, 9vw, 96px)", lineHeight: 0.9, letterSpacing: -2 }}>{statBlock.value}</Typography>
            {statBlock.unit && <Typography sx={{ color: p.accent, fontWeight: 700, fontSize: "clamp(14px, 1.8vw, 20px)", opacity: 0.8, mt: 1 }}>{statBlock.unit}</Typography>}
            {statBlock.context && <Typography sx={{ color: p.body, fontSize: "clamp(10px, 1.2vw, 13px)", opacity: 0.7, mt: 1, lineHeight: 1.4 }}>{statBlock.context}</Typography>}
          </Box>
        )}
        {textBlocks.map((b, i) => <Typography key={i} sx={{ color: p.body, fontSize: "clamp(10px, 1.2vw, 13px)", lineHeight: 1.6, mb: "2%", flexShrink: 0 }}>{b.value}</Typography>)}
        {items.map((item, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: "1.5%" }}>
            <Box sx={{ flexShrink: 0, mt: "5px", width: 6, height: 6, borderRadius: "50%", bgcolor: p.accent }} />
            <Typography sx={{ color: p.body, fontSize: "clamp(10px, 1.1vw, 12.5px)", lineHeight: 1.5 }}>{item}</Typography>
          </Box>
        ))}
      </Box>
      {slide.image_b64 && (
        <Box sx={{ flexShrink: 0, width: "36%", backgroundImage: `url(data:image/png;base64,${slide.image_b64})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      )}
    </Box>
  );
}

function AnalogySlide({ slide, p }) {
  const textBlocks = slide.content?.filter(b => b.type === "text") || [];
  const listBlock = slide.content?.find(b => b.type === "list");
  const items = listBlock ? (Array.isArray(listBlock.value) ? listBlock.value : String(listBlock.value).split("\n").filter(Boolean)) : [];
  return (
    <Box sx={{ minHeight: 517, bgcolor: p.bg, display: "flex", flexDirection: slide.image_b64 ? "row" : "column", overflow: "visible" }}>
      {slide.image_b64 && (
        <Box sx={{ flexShrink: 0, width: "38%", backgroundImage: `url(data:image/png;base64,${slide.image_b64})`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: "0 0 0 0" }} />
      )}
      <Box sx={{ flex: 1, p: "4% 5%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, mb: "2%", flexShrink: 0 }}>
          <Box sx={{ bgcolor: "#2D6A4F", color: "#fff", px: 1.25, py: 0.3, borderRadius: 1, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>Analogy</Box>
        </Box>
        <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(14px, 2vw, 22px)", mb: "3%", flexShrink: 0 }}>{slide.title}</Typography>
        {textBlocks.slice(0, 1).map((b, i) => (
          <Typography key={i} sx={{ color: p.body, fontSize: "clamp(11px, 1.3vw, 14px)", lineHeight: 1.6, mb: "3%", fontStyle: "italic", opacity: 0.9, flexShrink: 0 }}>{b.value}</Typography>
        ))}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "2%", flex: 1 }}>
          {items.map((item, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: "2%", p: "1.5% 2%", borderRadius: 2, bgcolor: `#2D6A4F10`, border: `1px solid #2D6A4F30` }}>
              <Typography sx={{ color: "#2D6A4F", fontWeight: 800, fontSize: "clamp(14px, 1.6vw, 18px)", flexShrink: 0, lineHeight: 1 }}>↔</Typography>
              <Typography sx={{ color: p.body, fontSize: "clamp(10px, 1.2vw, 13px)", lineHeight: 1.5 }}>{item}</Typography>
            </Box>
          ))}
        </Box>
        {textBlocks[1] && (
          <Typography sx={{ color: p.body, opacity: 0.5, fontSize: "clamp(9px, 1vw, 11px)", mt: "3%", fontStyle: "italic", flexShrink: 0 }}>⚠ {textBlocks[1].value}</Typography>
        )}
      </Box>
    </Box>
  );
}

function TrueFalseSlide({ slide, p }) {
  const statementBlock = slide.content?.find(b => b.type === "text");
  const answerBlock = slide.content?.find(b => b.type === "tf_answer");
  const isTrue = answerBlock?.value === "true";
  return (
    <Box sx={{ minHeight: 517, bgcolor: p.bg, p: "4% 5%", display: "flex", flexDirection: "column", overflow: "visible" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: "3%", flexShrink: 0 }}>
        <Box sx={{ bgcolor: "#D4891A", color: "#fff", px: 1.25, py: 0.3, borderRadius: 1, fontSize: 10, fontWeight: 700 }}>True / False</Box>
        <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(12px, 1.8vw, 18px)" }}>{slide.title}</Typography>
      </Box>
      {statementBlock && (
        <Box sx={{ borderRadius: 2, border: `2px solid ${p.border}`, p: "3% 4%", mb: "4%", flexShrink: 0 }}>
          <Typography sx={{ color: p.body, fontSize: "clamp(12px, 1.5vw, 16px)", lineHeight: 1.6, textAlign: "center", fontWeight: 500 }}>{statementBlock.value}</Typography>
        </Box>
      )}
      <Box sx={{ display: "flex", gap: "3%", mb: "4%", flexShrink: 0 }}>
        <Box sx={{ flex: 1, borderRadius: 2, p: "2.5% 3%", display: "flex", alignItems: "center", justifyContent: "center", gap: 1, border: `2px solid ${isTrue ? "#2D6A4F" : p.border}`, bgcolor: isTrue ? "#2D6A4F15" : "transparent" }}>
          <Typography sx={{ fontSize: "clamp(16px, 2vw, 22px)" }}>✅</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: "clamp(13px, 1.6vw, 17px)", color: isTrue ? "#2D6A4F" : p.body, opacity: isTrue ? 1 : 0.4 }}>TRUE</Typography>
          {isTrue && <Box sx={{ bgcolor: "#2D6A4F", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>✓</Box>}
        </Box>
        <Box sx={{ flex: 1, borderRadius: 2, p: "2.5% 3%", display: "flex", alignItems: "center", justifyContent: "center", gap: 1, border: `2px solid ${!isTrue ? "#C1121F" : p.border}`, bgcolor: !isTrue ? "#C1121F15" : "transparent" }}>
          <Typography sx={{ fontSize: "clamp(16px, 2vw, 22px)" }}>❌</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: "clamp(13px, 1.6vw, 17px)", color: !isTrue ? "#C1121F" : p.body, opacity: !isTrue ? 1 : 0.4 }}>FALSE</Typography>
          {!isTrue && <Box sx={{ bgcolor: "#C1121F", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>✓</Box>}
        </Box>
      </Box>
      {answerBlock?.explanation && (
        <Box sx={{ borderRadius: 2, bgcolor: `${p.accent}10`, border: `1px solid ${p.accent}30`, p: "2.5% 3%", flexShrink: 0 }}>
          <Typography sx={{ color: p.accent, fontWeight: 700, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, mb: 0.5 }}>Why?</Typography>
          <Typography sx={{ color: p.body, fontSize: "clamp(10px, 1.2vw, 13px)", lineHeight: 1.6 }}>{answerBlock.explanation}</Typography>
        </Box>
      )}
    </Box>
  );
}

function ComparisonSlide({ slide, p }) {
  const tableBlock = slide.content?.find(b => b.type === "table");
  const textBlock = slide.content?.find(b => b.type === "text");
  return (
    <Box sx={{ minHeight: 517, bgcolor: p.bg, p: "4% 5%", display: "flex", flexDirection: "column", overflow: "visible" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: "2%", flexShrink: 0 }}>
        <Box sx={{ bgcolor: "#457B9D", color: "#fff", px: 1.25, py: 0.3, borderRadius: 1, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8 }}>vs</Box>
        <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(14px, 2vw, 22px)" }}>{slide.title}</Typography>
      </Box>
      {textBlock && <Typography sx={{ color: p.body, opacity: 0.7, fontSize: "clamp(10px, 1.2vw, 13px)", mb: "2.5%", flexShrink: 0 }}>{textBlock.value}</Typography>}
      {tableBlock && (
        <Box sx={{ flex: 1, borderRadius: 2, border: `1px solid ${p.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {tableBlock.headers?.map((h, j) => (
                  <th key={j} style={{ padding: "8px 14px", background: j === 0 ? p.border : "#457B9D", color: j === 0 ? p.body : "#fff", textAlign: j === 0 ? "left" : "center", fontSize: 12, fontWeight: 700, borderRight: `1px solid ${p.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableBlock.rows?.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : `${p.border}40` }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: "7px 14px", color: ci === 0 ? p.title : p.body, fontSize: ci === 0 ? 13 : 12.5, fontWeight: ci === 0 ? 600 : 400, textAlign: ci === 0 ? "left" : "center", borderBottom: `1px solid ${p.border}`, borderRight: `1px solid ${p.border}40` }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}
    </Box>
  );
}

function SlideView({ slide, theme }) {

  const p = THEME_PALETTE[theme] || THEME_PALETTE.dark;

  if (!slide) return null;

  switch (slide.type) {

    case "title":               return <TitleSlide slide={slide} p={p} />;

    case "learning_objectives": return <ObjectivesSlide slide={slide} p={p} />;

    case "quiz":                return <QuizSlide slide={slide} p={p} />;

    case "quiz_answer":         return <QuizAnswerSlide slide={slide} p={p} />;

    case "summary":             return <SummarySlide slide={slide} p={p} />;

    case "hook":                return <HookSlide slide={slide} p={p} />;

    case "concept_card":        return <ConceptCardSlide slide={slide} p={p} />;

    case "steps":               return <StepsSlide slide={slide} p={p} />;

    case "myth_bust":           return <MythBustSlide slide={slide} p={p} />;

    case "big_stat":            return <BigStatSlide slide={slide} p={p} />;

    case "analogy":             return <AnalogySlide slide={slide} p={p} />;

    case "true_false":          return <TrueFalseSlide slide={slide} p={p} />;

    case "comparison":          return <ComparisonSlide slide={slide} p={p} />;

    default:                   return <GenericSlide slide={slide} p={p} />;

  }

}



function LoadingSlide({ planSlide, theme }) {

  const p = THEME_PALETTE[theme] || THEME_PALETTE.dark;

  return (

    <Box sx={{ height: "100%", bgcolor: p.bg, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 2 }}>

      <CircularProgress size={32} sx={{ color: p.accent }} />

      {planSlide && (

        <Box sx={{ textAlign: "center" }}>

          <Box sx={{ bgcolor: SLIDE_TYPE_COLORS[planSlide.type] || "#4361EE", color: "#fff", px: 1.25, py: 0.3, borderRadius: 1, fontSize: 10, fontWeight: 700, display: "inline-block", mb: 0.75 }}>

            {SLIDE_TYPE_LABELS[planSlide.type] || planSlide.type}

          </Box>

          <Typography sx={{ color: p.body, opacity: 0.6, fontSize: 13, display: "block" }}>{planSlide.title}</Typography>

        </Box>

      )}

    </Box>

  );

}



// â"€â"€ Grid card components â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function getSlidePreview(slide) {

  if (!slide?.content) return "";

  for (const b of slide.content) {

    if (b.type === "text")    return String(b.value).slice(0, 90);

    if (b.type === "list")    return Array.isArray(b.value) ? b.value[0] : String(b.value).split("\n")[0];

    if (b.type === "formula") return b.value;

  }

  return "";

}



function SlideCardMini({ slide, index, theme, onClick, selected }) {

  const p = THEME_PALETTE[theme] || THEME_PALETTE.dark;

  return (

    <Box onClick={onClick} sx={{

      aspectRatio: "16 / 9", borderRadius: 2, overflow: "hidden",

      bgcolor: p.bg, cursor: "pointer",

      border: `2px solid ${selected ? p.accent : "transparent"}`,

      transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",

      animation: "cardIn 0.4s cubic-bezier(0.4,0,0.2,1)",

      "@keyframes cardIn": { from: { opacity: 0, transform: "scale(0.92)" }, to: { opacity: 1, transform: "scale(1)" } },

      "&:hover": { transform: "translateY(-3px)", boxShadow: "0 12px 28px rgba(0,0,0,0.15)", borderColor: p.accent },

      display: "flex", flexDirection: "column", p: "4%",

    }}>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: "4%", flexShrink: 0 }}>

        <Box sx={{ bgcolor: SLIDE_TYPE_COLORS[slide.type] || "#4361EE", color: "#fff", px: 1, py: 0.25, borderRadius: 0.75, fontSize: 9, fontWeight: 700, letterSpacing: 0.3, whiteSpace: "nowrap" }}>

          {SLIDE_TYPE_LABELS[slide.type] || slide.type}

        </Box>

        <Typography sx={{ color: p.body, opacity: 0.4, fontSize: 9 }}>#{index + 1}</Typography>

        {slide.image_b64 && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: p.accent, ml: "auto", flexShrink: 0 }} />}

      </Box>

      <Typography sx={{ color: p.title, fontWeight: 700, fontSize: "clamp(9px, 1vw, 11px)", mb: "3%", lineHeight: 1.3, flexShrink: 0 }} noWrap>{slide.title}</Typography>

      <Typography sx={{ color: p.body, opacity: 0.6, fontSize: 9, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>

        {getSlidePreview(slide)}

      </Typography>

    </Box>

  );

}



function SkeletonCard({ index, planSlide }) {

  const slideType = planSlide?.type || "content";

  const slideTitle = planSlide?.title || `Slide ${index + 1}`;

  return (

    <Box sx={{

      aspectRatio: "16 / 9", borderRadius: 2, overflow: "hidden",

      bgcolor: "#F0F2F8", p: "4%", display: "flex", flexDirection: "column", gap: "3%",

      border: "2px solid transparent",

      animation: "pulse 2.4s ease-in-out infinite",

      "@keyframes pulse": { "0%, 100%": { opacity: 0.75 }, "50%": { opacity: 0.45 } },

    }}>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>

        <Box sx={{ bgcolor: `${SLIDE_TYPE_COLORS[slideType] || "#4361EE"}50`, px: 1, py: 0.25, borderRadius: 0.75, fontSize: 9, fontWeight: 700, color: "transparent" }}>

          {SLIDE_TYPE_LABELS[slideType] || slideType}

        </Box>

        <Typography sx={{ color: "#B0B8D0", fontSize: 9 }}>#{index + 1}</Typography>

        <CircularProgress size={8} sx={{ ml: "auto", color: "#B0B8D0" }} />

      </Box>

      <Typography sx={{ color: "#8890A8", fontWeight: 700, fontSize: "clamp(9px, 1vw, 11px)", lineHeight: 1.3, flexShrink: 0 }} noWrap>{slideTitle}</Typography>

      <Skeleton variant="text" width="100%" height={10} sx={{ borderRadius: 1, transform: "none" }} />

      <Skeleton variant="text" width="72%" height={10} sx={{ borderRadius: 1, transform: "none" }} />

      <Skeleton variant="rectangular" sx={{ flex: 1, borderRadius: 1, transform: "none" }} />

    </Box>

  );

}



// â"€â"€ Thumbnail strip â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function ThumbStrip({ slides, planSlides, current, theme, onSelect, totalExpected }) {

  const p = THEME_PALETTE[theme] || THEME_PALETTE.dark;

  const containerRef = useRef(null);

  useEffect(() => {

    const el = containerRef.current?.children[current];

    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

  }, [current]);

  const total = Math.max(slides.length, totalExpected || 0, (planSlides || []).length);

  return (

    <Box ref={containerRef} sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5, mt: 1.5,

      scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>

      {Array.from({ length: total }).map((_, i) => {

        const s = slides[i];

        const ps = planSlides?.[i];

        const display = s || ps;

        const isPending = !s;

        return (

          <Paper key={i} onClick={() => onSelect(i)} elevation={0} sx={{

            minWidth: 80, p: "5px 7px", cursor: "pointer", flexShrink: 0, borderRadius: 1.5,

            bgcolor: p.bg, opacity: isPending ? 0.5 : 1,

            border: `2px solid ${i === current ? p.accent : "transparent"}`,

            transition: "border-color 0.15s, opacity 0.3s",

            "&:hover": { borderColor: `${p.accent}80` },

          }}>

            <Box sx={{

              bgcolor: isPending

                ? `${SLIDE_TYPE_COLORS[display?.type || "content"]}40`

                : (SLIDE_TYPE_COLORS[display?.type] || "#4361EE"),

              color: isPending ? "transparent" : "#fff",

              borderRadius: 0.5, px: 0.75, py: 0.2, fontSize: 8, fontWeight: 700, mb: 0.4, display: "inline-block",

            }}>

              {SLIDE_TYPE_LABELS[display?.type] || "Content"}

            </Box>

            <Typography sx={{ color: isPending ? `${p.body}60` : p.title, fontWeight: 600, display: "block", lineHeight: 1.3, fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>

              {display?.title || `Slide ${i + 1}`}

            </Typography>

            {isPending && <CircularProgress size={6} sx={{ color: p.accent, display: "block", mx: "auto", mt: 0.5 }} />}

          </Paper>

        );

      })}

    </Box>

  );

}



// â"€â"€ Main page â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export default function LessonViewer() {

  const { id } = useParams();

  const navigate = useNavigate();

  const location = useLocation();

  const planSlides = useMemo(() => location.state?.plan?.slides || [], [location.state]);



  const [lesson, setLesson] = useState(null);

  const [loading, setLoading] = useState(true);

  const [currentSlide, setCurrentSlide] = useState(0);

  const [viewMode, setViewMode] = useState("slideshow");

  const [exporting, setExporting] = useState(false);

  const [theme, setTheme] = useState("dark");

  const [streamingSlides, setStreamingSlides] = useState([]);

  const [streamDone, setStreamDone] = useState(false);

  const [streamError, setStreamError] = useState("");

  const [streamTitle, setStreamTitle] = useState("");

  const caption = useCaptionCycler(GEN_CAPTIONS);

  const userHasNavigated = useRef(false);

  const totalDisplayCountRef = useRef(1);



  useEffect(() => {

    api.get(`/lessons/${id}`).then((res) => {

      const les = res.data.lesson;

      setLesson(les);

      setTheme(les.theme || "dark");

      if (les.status === "generating") {

        const total = planSlides.length || les.slide_count || 10;

        setStreamingSlides(new Array(total).fill(null));

        startSSEStream(les.id);

      }

    }).finally(() => setLoading(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [id]);



  // Keyboard navigation

  useEffect(() => {

    if (viewMode !== "slideshow") return;

    const onKey = (e) => {

      setCurrentSlide(prev => {

        const max = totalDisplayCountRef.current - 1;

        if (e.key === "ArrowRight" || e.key === "ArrowDown") return Math.min(max, prev + 1);

        if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   return Math.max(0, prev - 1);

        return prev;

      });

    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [viewMode]);



  const startSSEStream = useCallback((lessonId) => {

    const token = localStorage.getItem("token");

    // Use the same base URL as the axios instance so this works in any environment

    const url = `${api.defaults.baseURL}/lessons/${lessonId}/stream`;

    (async () => {

      try {

        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

        const reader = res.body.getReader();

        const dec = new TextDecoder();

        let buf = "";

        while (true) {

          const { done, value } = await reader.read();

          if (done) break;

          buf += dec.decode(value, { stream: true });

          const parts = buf.split("\n\n");

          buf = parts.pop();

          for (const part of parts) {

            const line = part.trim();

            if (!line.startsWith("data: ")) continue;

            try {

              const msg = JSON.parse(line.slice(6));

              handleMsg(msg);

              if (msg.type === "complete" || msg.type === "error") return;

            } catch { /* skip */ }

          }

        }

      } catch {

        setStreamError("Connection lost. Refresh to check status.");

      }

    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);



  const handleMsg = (msg) => {

    if (msg.type === "title") setStreamTitle(msg.title);

    if (msg.type === "slide") {

      setStreamingSlides(prev => {

        const next = [...prev];

        while (next.length <= msg.index) next.push(null);

        next[msg.index] = msg.slide;

        return next;

      });

      if (!userHasNavigated.current) {

        setCurrentSlide(msg.index);

      }

    }

    if (msg.type === "image") {

      setStreamingSlides(prev => prev.map((s, i) =>

        i === msg.index && s ? { ...s, image_b64: msg.image_b64 } : s

      ));

    }

    if (msg.type === "complete") {

      setLesson(msg.lesson);

      setTheme(msg.lesson.theme || "dark");

      setStreamDone(true);

    }

    if (msg.type === "error") setStreamError(msg.message || "Generation failed.");

  };



  const handleExport = async () => {

    setExporting(true);

    try {

      const res = await api.get(`/lessons/${id}/export/pptx`, { responseType: "blob", params: { theme } });

      const url = window.URL.createObjectURL(new Blob([res.data]));

      const a = document.createElement("a");

      a.href = url; a.download = `${lesson.title}.pptx`; a.click();

    } catch { /* ignore */ }

    finally { setExporting(false); }

  };



  // Derived display state

  const isGenerating = lesson?.status === "generating" && !streamDone;

  const finalSlides  = lesson?.slides_json?.slides || [];

  const displaySlides = streamDone ? finalSlides : isGenerating ? streamingSlides : finalSlides;

  const filledSlides  = displaySlides.filter(Boolean);

  const totalExpected = planSlides.length || lesson?.slide_count || displaySlides.length;

  const completedCount = filledSlides.length;

  const totalDisplayCount = isGenerating ? Math.max(displaySlides.length, totalExpected) : filledSlides.length;

  totalDisplayCountRef.current = totalDisplayCount;

  const slide = displaySlides[currentSlide] || null;



  if (loading) return (

    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>

      <CircularProgress />

    </Box>

  );

  if (!lesson) return <Alert severity="error" sx={{ m: 4 }}>Lesson not found</Alert>;



  return (

    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1100, mx: "auto" }}>

      {/* â"€â"€ Header â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>

        <Box>

          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/lessons")} size="small" sx={{ mb: 0.75, color: "text.secondary" }}>Back</Button>

          <Typography variant="h5" fontWeight={700} sx={{ color: "text.primary", lineHeight: 1.2 }}>

            {streamTitle || lesson.title}

          </Typography>

          <Box sx={{ display: "flex", gap: 0.75, mt: 0.75, flexWrap: "wrap", alignItems: "center" }}>

            {lesson.subject  && <Chip label={lesson.subject}  size="small" sx={{ height: 22, fontSize: 11 }} />}

            {lesson.branch   && <Chip label={lesson.branch}   size="small" sx={{ height: 22, fontSize: 11 }} />}

            {lesson.semester && <Chip label={`Sem ${lesson.semester}`} size="small" sx={{ height: 22, fontSize: 11 }} />}

            <Chip

              label={streamDone ? "completed" : isGenerating ? "generating" : lesson.status}

              size="small"

              icon={streamDone ? <CheckCircleIcon sx={{ fontSize: "14px !important" }} /> : undefined}

              color={streamDone || lesson.status === "completed" ? "success" : isGenerating ? "warning" : "error"}

              sx={{ height: 22, fontSize: 11 }}

            />

          </Box>

        </Box>



        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>

          {!isGenerating && filledSlides.length > 0 && (

            <Box sx={{ display: "flex", border: "1px solid", borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>

              <Tooltip title="Slideshow">

                <IconButton size="small" onClick={() => setViewMode("slideshow")}

                  sx={{ borderRadius: 0, bgcolor: viewMode === "slideshow" ? "primary.main" : "transparent",

                    color: viewMode === "slideshow" ? "#fff" : "text.secondary", px: 1.5, transition: "all 0.15s" }}>

                  <ViewCarouselIcon fontSize="small" />

                </IconButton>

              </Tooltip>

              <Tooltip title="Grid view">

                <IconButton size="small" onClick={() => setViewMode("grid")}

                  sx={{ borderRadius: 0, bgcolor: viewMode === "grid" ? "primary.main" : "transparent",

                    color: viewMode === "grid" ? "#fff" : "text.secondary", px: 1.5, transition: "all 0.15s" }}>

                  <GridViewIcon fontSize="small" />

                </IconButton>

              </Tooltip>

            </Box>

          )}

          <TextField select size="small" value={theme} onChange={(e) => setTheme(e.target.value)} sx={{ minWidth: 130 }}

            InputProps={{ startAdornment: <PaletteIcon sx={{ mr: 0.5, fontSize: 16, color: "text.secondary" }} /> }}>

            {THEME_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}

          </TextField>

          {(lesson.status === "completed" || streamDone) && (

            <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport} disabled={exporting} size="small">

              {exporting ? "Exporting..." : "Export PPTX"}

            </Button>

          )}

        </Box>

      </Box>



      {streamError && <Alert severity="error" sx={{ mb: 2 }}>{streamError}</Alert>}

      {lesson.status === "failed" && !isGenerating && (

        <Alert severity="error" sx={{ mb: 2 }}>{lesson.error_message || "Generation failed"}</Alert>

      )}



      {/* â"€â"€ Generation progress (compact) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}

      {isGenerating && (

        <Box sx={{ mb: 2 }}>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>

              <CircularProgress size={13} thickness={5} />

              <Typography variant="caption" fontWeight={600} color="text.secondary">

                {completedCount} / {totalExpected} slides

              </Typography>

            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>{caption}</Typography>

          </Box>

          <LinearProgress variant={totalExpected > 0 ? "determinate" : "indeterminate"} value={totalExpected > 0 ? (completedCount / totalExpected) * 100 : 0} sx={{ borderRadius: 1, height: 3 }} />

        </Box>

      )}



      {/* â"€â"€ GRID VIEW (post-generation browse only) â"€â"€â"€â"€â"€â"€â"€â"€ */}

      {!isGenerating && viewMode === "grid" && (

        <Grid container spacing={1.5}>

          {filledSlides.map((s, i) => (

            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>

              <SlideCardMini slide={s} index={i} theme={theme}

                selected={currentSlide === i}

                onClick={() => { setCurrentSlide(i); setViewMode("slideshow"); }} />

            </Grid>

          ))}

        </Grid>

      )}



      {/* â"€â"€ SLIDESHOW VIEW (always shown, including during generation) â"€ */}

      {viewMode === "slideshow" && (displaySlides.length > 0 || isGenerating) && (

        <>

          <Box sx={{

            position: "relative", width: "100%", mx: "auto", maxWidth: 920,

            minHeight: 517, borderRadius: 3, overflow: "visible",

            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",

            animation: "sIn 0.3s ease",

            "@keyframes sIn": { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "none" } },

          }}>

            {slide

              ? <SlideView key={currentSlide} slide={slide} theme={theme} />

              : <LoadingSlide planSlide={planSlides[currentSlide]} theme={theme} />

            }

          </Box>



          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mt: 2 }}>

            <IconButton onClick={() => { userHasNavigated.current = true; setCurrentSlide(p => Math.max(0, p - 1)); }} disabled={currentSlide === 0}

              sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", transition: "all 0.15s",

                "&:hover": { bgcolor: "primary.main", color: "#fff", borderColor: "primary.main" } }}>

              <ArrowBackIosNewIcon fontSize="small" />

            </IconButton>

            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, textAlign: "center" }}>

              {currentSlide + 1} / {totalDisplayCount}

            </Typography>

            <IconButton onClick={() => { userHasNavigated.current = true; setCurrentSlide(p => Math.min(totalDisplayCount - 1, p + 1)); }} disabled={currentSlide === totalDisplayCount - 1}

              sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", transition: "all 0.15s",

                "&:hover": { bgcolor: "primary.main", color: "#fff", borderColor: "primary.main" } }}>

              <ArrowForwardIosIcon fontSize="small" />

            </IconButton>

          </Box>



          {slide?.speaker_notes && (

            <Box sx={{ mt: 2, bgcolor: "background.paper", borderRadius: 2, p: 2, border: "1px solid", borderColor: "divider", maxWidth: 920, mx: "auto" }}>

              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 1, textTransform: "uppercase", display: "block", mb: 0.5 }}>Speaker Notes</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{slide.speaker_notes}</Typography>

            </Box>

          )}



          <Box sx={{ maxWidth: 920, mx: "auto" }}>

            <ThumbStrip

              slides={displaySlides}

              planSlides={planSlides}

              current={currentSlide}

              theme={theme}

              totalExpected={isGenerating ? totalExpected : 0}

              onSelect={(i) => { userHasNavigated.current = true; setCurrentSlide(i); }}

            />

          </Box>

        </>

      )}

    </Box>

  );

}

