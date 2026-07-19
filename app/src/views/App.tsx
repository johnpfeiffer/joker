import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { JokeResponseCard } from "../components/JokeResponseCard";
import Footer from "../components/Footer";
import { useJokeChat } from "../controllers/useJokeChat";
import { STATIC_PROMPT } from "../prompts/jokePrompt";

type JokeViewMode = "chronological" | "preference";

export default function App() {
  const {
    responses,
    priorityResponses,
    isLoading,
    error,
    nextPrompt,
    requestNextJoke,
    rateResponse,
    moveResponsePriority,
    resetJokeHistory,
  } = useJokeChat();
  const [viewMode, setViewMode] = useState<JokeViewMode>("chronological");
  const [draggedResponseId, setDraggedResponseId] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isPromptInspectionExpanded, setIsPromptInspectionExpanded] = useState(false);
  const chronologicalResponses = [...responses].reverse();
  const displayedResponses = viewMode === "preference" ? priorityResponses : chronologicalResponses;

  function handleViewModeChange(_: unknown, nextViewMode: JokeViewMode | null) {
    if (nextViewMode) {
      setViewMode(nextViewMode);
    }
  }

  function handleDrop(targetId: string) {
    if (draggedResponseId) {
      moveResponsePriority(draggedResponseId, targetId);
    }
    setDraggedResponseId("");
  }

  function handleResetConfirmation() {
    resetJokeHistory();
    setIsResetDialogOpen(false);
  }

  return (
    <Box sx={{ minHeight: "100vh", py: { xs: 2, md: 3 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2.5}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
            <Typography variant="h1">Remember how LLM chat worked in 2023...</Typography>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setIsResetDialogOpen(true)}
              disabled={isLoading}
            >
              Reset
            </Button>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(260px, 360px) minmax(0, 1fr)" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                position: { md: "sticky" },
                top: 16,
                borderRadius: 1,
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h2">Prompt</Typography>
                  <Tooltip title="Early pattern of single User prompt, without multi-turn messages">
                    <Typography sx={{ mt: 1, display: "inline-block" }}>{STATIC_PROMPT}</Typography>
                  </Tooltip>
                </Box>
                <Divider />
                <Button
                  variant="contained"
                  onClick={requestNextJoke}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress color="inherit" size={16} /> : null}
                >
                  {isLoading ? "Asking" : "Get a new joke"}
                </Button>
                <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
                  <Typography variant="h2">Responses</Typography>
                  <Typography color="text.secondary">{responses.length}</Typography>
                </Stack>
                <Tooltip title="See how previous jokes, ratings, and rankings accumulate into the next prompt.">
                  <Accordion
                    variant="outlined"
                    disableGutters
                    expanded={isPromptInspectionExpanded}
                    onChange={(_, expanded) => setIsPromptInspectionExpanded(expanded)}
                    sx={{ borderRadius: 1 }}
                  >
                    <AccordionSummary
                      aria-label="Prompt inspection"
                      expandIcon={<span aria-hidden="true">{isPromptInspectionExpanded ? "−" : "+"}</span>}
                    >
                      <Typography>Prompt inspection</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <PromptInspectionText prompt={nextPrompt} />
                    </AccordionDetails>
                  </Accordion>
                </Tooltip>
                {error ? <Alert severity="error">{error}</Alert> : null}
              </Stack>
            </Paper>

            <Box component="main">
              <Box sx={{ mb: 1.5 }}>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={viewMode}
                  onChange={handleViewModeChange}
                  aria-label="Joke view"
                >
                  <ToggleButton value="chronological" sx={viewToggleSx}>
                    Chronological view
                  </ToggleButton>
                  <ToggleButton value="preference" sx={viewToggleSx}>
                    Rankings
                  </ToggleButton>
                </ToggleButtonGroup>
                {viewMode === "preference" ? (
                  <Typography
                    variant="caption"
                    component="p"
                    color="text.secondary"
                    sx={{ mt: 0.75, mb: 0, fontStyle: "italic" }}
                  >
                    Drag your favorite joke to the top.
                  </Typography>
                ) : null}
              </Box>
              {responses.length === 0 ? (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    minHeight: 180,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Typography color="text.secondary">
                    No responses yet.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={1.5}>
                  {displayedResponses.map((response, index) => (
                    <JokeResponseCard
                      key={response.id}
                      response={response}
                      draggable={viewMode === "preference"}
                      priorityRank={viewMode === "preference" ? index + 1 : undefined}
                      onRate={(rating) => rateResponse(response.id, rating)}
                      onDragStart={() => setDraggedResponseId(response.id)}
                      onDragOver={(event) => {
                        if (viewMode === "preference") {
                          event.preventDefault();
                        }
                      }}
                      onDrop={() => handleDrop(response.id)}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        </Stack>
      </Container>
      <Footer />
      <Dialog open={isResetDialogOpen} onClose={() => setIsResetDialogOpen(false)}>
        <DialogTitle>Reset joke history?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently clears all saved jokes, ratings, and preference ordering.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsResetDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleResetConfirmation} autoFocus>
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function PromptInspectionText({ prompt }: { prompt: string }) {
  const lines = prompt.split("\n");

  return (
    <Typography
      component="pre"
      data-testid="prompt-inspection-text"
      sx={{
        m: 0,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontFamily: "monospace",
        fontSize: "0.75rem",
      }}
    >
      {lines.map((line, index) => (
        <span key={`${index}-${line}`}>
          {renderPromptLine(line)}
          {index < lines.length - 1 ? "\n" : null}
        </span>
      ))}
    </Typography>
  );
}

function renderPromptLine(line: string) {
  if (!isJsonLikeLine(line)) {
    return line;
  }

  const tokens = line.match(/"[^"]*"|\b\d+\b|\bnull\b|[{}\[\]:,]|[^"{}\[\]:,\d]+|\d+/g) ?? [line];
  return tokens.map((token, index) => {
    if (/^"[^"]*"$/.test(token)) {
      const nextToken = tokens[index + 1];
      return (
        <Box
          key={`${index}-${token}`}
          component="span"
          sx={{ color: nextToken === ":" ? "primary.main" : "success.dark" }}
        >
          {token}
        </Box>
      );
    }

    if (/^\d+$/.test(token)) {
      return (
        <Box key={`${index}-${token}`} component="span" sx={{ color: "secondary.main" }}>
          {token}
        </Box>
      );
    }

    if (token === "null") {
      return (
        <Box key={`${index}-${token}`} component="span" sx={{ color: "text.secondary" }}>
          {token}
        </Box>
      );
    }

    if (/^[{}\[\]:,]$/.test(token)) {
      return (
        <Box key={`${index}-${token}`} component="span" sx={{ color: "text.secondary" }}>
          {token}
        </Box>
      );
    }

    return token;
  });
}

function isJsonLikeLine(line: string): boolean {
  return /^[{}\[\]"]/.test(line.trim());
}

const viewToggleSx = {
  "&.Mui-selected": {
    bgcolor: "#e3f2fd",
    color: "#0d47a1",
    "&:hover": {
      bgcolor: "#bbdefb",
    },
  },
};
