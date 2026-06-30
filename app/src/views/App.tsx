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
  Paper,
  Stack,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { JokeResponseCard } from "../components/JokeResponseCard";
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
  } = useJokeChat();
  const [viewMode, setViewMode] = useState<JokeViewMode>("chronological");
  const [draggedResponseId, setDraggedResponseId] = useState("");
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

  return (
    <Box sx={{ minHeight: "100vh", py: { xs: 2, md: 3 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h1">Remember how LLM chat worked in 2023...</Typography>
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
                <Box>
                  <Typography variant="h2">Responses</Typography>
                  <Typography color="text.secondary">{responses.length}</Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={requestNextJoke}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress color="inherit" size={16} /> : null}
                >
                  {isLoading ? "Asking" : "Get new joke"}
                </Button>
                <Tooltip title="Highest signal examples in the feedback loop get the early attention priority">
                  <Accordion variant="outlined" disableGutters sx={{ borderRadius: 1 }}>
                    <AccordionSummary
                      aria-label="Prompt inspection"
                      expandIcon={<span aria-hidden="true">+</span>}
                    >
                      <Typography>Prompt inspection</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography
                        component="pre"
                        sx={{
                          m: 0,
                          maxHeight: 260,
                          overflow: "auto",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          fontFamily: "monospace",
                          fontSize: "0.75rem",
                        }}
                      >
                        {nextPrompt}
                      </Typography>
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
                    Preference view
                  </ToggleButton>
                </ToggleButtonGroup>
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
    </Box>
  );
}

const viewToggleSx = {
  textDecoration: "underline",
  textUnderlineOffset: "3px",
  "&.Mui-selected": {
    bgcolor: "success.light",
    color: "success.contrastText",
    "&:hover": {
      bgcolor: "success.main",
    },
  },
};
