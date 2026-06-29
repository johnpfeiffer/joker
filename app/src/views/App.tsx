import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { JokeResponseCard } from "../components/JokeResponseCard";
import { useJokeChat } from "../controllers/useJokeChat";
import { STATIC_PROMPT } from "../prompts/jokePrompt";

export default function App() {
  const {
    responses,
    isLoading,
    error,
    requestNextJoke,
    rateResponse,
  } = useJokeChat();

  return (
    <Box sx={{ minHeight: "100vh", py: { xs: 2, md: 3 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h1">Joker</Typography>
            <Typography color="text.secondary">Remember 2023</Typography>
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
                  <Typography sx={{ mt: 1 }}>{STATIC_PROMPT}</Typography>
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
                {error ? <Alert severity="error">{error}</Alert> : null}
              </Stack>
            </Paper>

            <Box component="main">
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
                  {[...responses].reverse().map((response) => (
                    <JokeResponseCard
                      key={response.id}
                      response={response}
                      onRate={(rating) => rateResponse(response.id, rating)}
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
