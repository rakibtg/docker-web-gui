import {
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  IconButton,
  Box,
} from "@mui/material";
import { Container } from "../../services/containerService";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import TerminalIcon from "@mui/icons-material/Terminal";

interface ContainerCardProps {
  container: Container;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
  onDelete: (id: string) => void;
  onViewLogs: (id: string) => void;
}

interface ContainerState {
  Status?: string;
  Running?: boolean;
}

const ContainerCard = ({
  container,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onViewLogs,
}: ContainerCardProps) => {
  const getStateColor = (state: string | ContainerState) => {
    const status = (
      typeof state === "string" ? state : state?.Status || "unknown"
    ).toLowerCase();
    switch (status) {
      case "running":
        return "success";
      case "exited":
        return "error";
      default:
        return "warning";
    }
  };

  const getStateLabel = (state: string | ContainerState): string => {
    return typeof state === "string" ? state : state?.Status || "Unknown";
  };

  const isRunning = (state: string | ContainerState): boolean => {
    if (typeof state === "string") {
      return state.toLowerCase() === "running";
    }
    return (
      state?.Running === true || state?.Status?.toLowerCase() === "running"
    );
  };

  return (
    <Card
      sx={{
        width: "100%",
        mb: 2,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: (theme) => theme.shadows[4],
        },
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
            {container.Name.replace(/^\//, "")}
          </Typography>
          <Chip
            label={getStateLabel(container.State)}
            color={
              getStateColor(container.State) as "success" | "error" | "warning"
            }
            size="small"
          />
        </Stack>

        <Typography color="text.secondary" gutterBottom>
          Image: {container.Image}
        </Typography>

        {container.Ports && container.Ports.length > 0 && (
          <Stack direction="row" spacing={1} mb={2}>
            {container.Ports.map((port, index) => (
              <Chip key={index} label={port} size="small" variant="outlined" />
            ))}
          </Stack>
        )}

        <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
          {!isRunning(container.State) && (
            <IconButton
              size="small"
              color="success"
              onClick={() => onStart(container.Id)}
              title="Start"
            >
              <PlayArrowIcon />
            </IconButton>
          )}
          {isRunning(container.State) && (
            <IconButton
              size="small"
              color="error"
              onClick={() => onStop(container.Id)}
              title="Stop"
            >
              <StopIcon />
            </IconButton>
          )}
          <IconButton
            size="small"
            color="primary"
            onClick={() => onRestart(container.Id)}
            title="Restart"
          >
            <RestartAltIcon />
          </IconButton>
          <IconButton
            size="small"
            color="info"
            onClick={() => onViewLogs(container.Id)}
            title="View Logs"
          >
            <TerminalIcon />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(container.Id)}
            title="Delete"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ContainerCard;
