import { Button, Card, CardActions, CardContent, Chip, Stack, Typography } from "@mui/material";
import type { ChatResponse, UserRating } from "../models/chat";

interface JokeResponseCardProps {
  response: ChatResponse;
  onRate: (rating: UserRating) => void;
}

export function JokeResponseCard({ response, onRate }: JokeResponseCardProps) {
  const rated = Boolean(response.rating);

  return (
    <Card variant="outlined" sx={{ borderRadius: 1 }}>
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Typography variant="caption" color="text.secondary">
              {formatCreatedAt(response.createdAt)}
            </Typography>
            {response.rating ? (
              <Chip size="small" label={ratingLabel(response.rating)} />
            ) : (
              <Chip size="small" label="Unrated" variant="outlined" />
            )}
          </Stack>
          <Typography sx={{ whiteSpace: "pre-wrap" }}>{response.content}</Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button
          size="small"
          variant={response.rating === "thumbs-up" ? "contained" : "outlined"}
          disabled={rated}
          onClick={() => onRate("thumbs-up")}
        >
          Thumbs up
        </Button>
        <Button
          size="small"
          variant={response.rating === "thumbs-down" ? "contained" : "outlined"}
          disabled={rated}
          onClick={() => onRate("thumbs-down")}
        >
          Thumbs down
        </Button>
      </CardActions>
    </Card>
  );
}

function ratingLabel(rating: UserRating): string {
  return rating === "thumbs-up" ? "Thumbs up" : "Thumbs down";
}

function formatCreatedAt(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
