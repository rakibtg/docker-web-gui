import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Snackbar,
} from "@mui/material";
import { Container, containerService } from "../services/containerService";
import ContainerCard from "../components/containers/ContainerCard";
import LogsDialog from "../components/containers/LogsDialog";

function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [status, setStatus] = useState<"active" | "all" | "stopped">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<{
    open: boolean;
    content: string;
    containerName: string;
  }>({
    open: false,
    content: "",
    containerName: "",
  });

  const fetchContainers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await containerService.fetchContainers(status);
      setContainers(data);
    } catch (err) {
      setError("Failed to fetch containers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
    // Refresh every 10 seconds
    const interval = setInterval(fetchContainers, 10000);
    return () => clearInterval(interval);
  }, [status]);

  const handleCommand = async (containerId: string, command: string) => {
    try {
      await containerService.executeCommand(containerId, command);
      fetchContainers();
    } catch (err) {
      setError(`Failed to execute command: ${command}`);
      console.error(err);
    }
  };

  const handleViewLogs = async (containerId: string, containerName: string) => {
    try {
      const logs = await containerService.fetchLogs(containerId);
      setLogs({ open: true, content: logs, containerName });
    } catch (err) {
      setError("Failed to fetch logs");
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" component="h1" sx={{ fontWeight: 500 }}>
          Docker Containers
        </Typography>
        <ToggleButtonGroup
          value={status}
          exclusive
          onChange={(_, newStatus) => newStatus && setStatus(newStatus)}
          size="small"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="stopped">Stopped</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading && <Typography>Loading...</Typography>}

      <Grid container spacing={2}>
        {containers.map((container) => (
          <Grid item xs={12} sm={6} md={4} key={container.Id}>
            <ContainerCard
              container={container}
              onStart={(id) => handleCommand(id, "start")}
              onStop={(id) => handleCommand(id, "stop")}
              onRestart={(id) => handleCommand(id, "restart")}
              onDelete={(id) => handleCommand(id, "rm")}
              onViewLogs={(id) => handleViewLogs(id, container.Name)}
            />
          </Grid>
        ))}
        {!loading && containers.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary" align="center">
              No containers found
            </Typography>
          </Grid>
        )}
      </Grid>

      <LogsDialog
        open={logs.open}
        onClose={() => setLogs((prev) => ({ ...prev, open: false }))}
        logs={logs.content}
        containerName={logs.containerName}
      />

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ContainersPage;
