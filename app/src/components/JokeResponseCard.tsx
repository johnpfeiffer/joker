import { Button, Card, CardActions, CardContent, Chip, Stack, Typography } from "@mui/material";
import type { DragEventHandler } from "react";
import type { ChatResponse, UserRating } from "../models/chat";

interface JokeResponseCardProps {
  response: ChatResponse;
  draggable?: boolean;
  priorityRank?: number;
  onRate: (rating: UserRating) => void;
  onDragStart?: DragEventHandler<HTMLElement>;
  onDragOver?: DragEventHandler<HTMLElement>;
  onDrop?: DragEventHandler<HTMLElement>;
}

export function JokeResponseCard({
  response,
  draggable = false,
  priorityRank,
  onRate,
  onDragStart,
  onDragOver,
  onDrop,
}: JokeResponseCardProps) {
  const rated = Boolean(response.rating);

  return (
    <Card
      component="article"
      variant="outlined"
      draggable={draggable}
      data-testid={`joke-card-${response.id}`}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      sx={{
        borderRadius: 1,
        cursor: draggable ? "grab" : "default",
      }}
    >
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Typography variant="caption" color="text.secondary">
              {formatCreatedAt(response.createdAt)}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              {priorityRank ? (
                <Typography variant="caption" color="text.secondary">
                  #{priorityRank}
                </Typography>
              ) : null}
              {response.rating ? (
                <Chip size="small" label={ratingLabel(response.rating)} />
              ) : null}
            </Stack>
          </Stack>
          <Typography sx={{ whiteSpace: "pre-wrap" }}>{response.text}</Typography>
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
  return rating === "thumbs-up" ? "ツ" : "=(";
}

function formatCreatedAt(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
