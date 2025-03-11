import { useState, useEffect, useCallback } from "react";
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import { Container, containerService } from "../services/containerService";
import LogsDialog from "../components/containers/LogsDialog";
import { DataTable } from "../components/common/DataTable";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import TerminalIcon from "@mui/icons-material/Terminal";

interface ContainerState {
  Status?: string;
  Running?: boolean;
}

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

  const fetchContainers = useCallback(async () => {
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
  }, [status]);

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 10000);
    return () => clearInterval(interval);
  }, [fetchContainers]);

  const handleCommand = async (containerId: string, command: string) => {
    try {
      await containerService.executeCommand(containerId, command);
      fetchContainers();
    } catch (err) {
      setError(`Failed to execute command: ${command}`);
      console.error(err);
    }
  };

  const handleBulkAction = async (selectedIds: string[], action: string) => {
    try {
      await Promise.all(
        selectedIds.map((id) => containerService.executeCommand(id, action))
      );
      fetchContainers();
    } catch (err) {
      setError(`Failed to execute bulk action: ${action}`);
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

  const getStateColor = (
    state: string | ContainerState
  ): "success" | "error" | "warning" => {
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

  const columns = [
    {
      id: "name",
      label: "Name",
      minWidth: 170,
      getValue: (container: Container) => container.Name.replace(/^\//, ""),
    },
    {
      id: "state",
      label: "State",
      minWidth: 130,
      getValue: (container: Container) => container.State,
      format: (value: string | ContainerState) => (
        <Chip
          label={typeof value === "string" ? value : value?.Status || "Unknown"}
          color={getStateColor(value)}
          size="small"
        />
      ),
    },
    {
      id: "image",
      label: "Image",
      minWidth: 170,
      getValue: (container: Container) => container.Image,
    },
    {
      id: "ports",
      label: "Ports",
      minWidth: 170,
      getValue: (container: Container) => container.Ports,
      format: (ports: string[]) => (
        <Stack direction="row" spacing={1}>
          {ports?.map((port, index) => (
            <Chip key={index} label={port} size="small" variant="outlined" />
          ))}
        </Stack>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      minWidth: 170,
      align: "right" as const,
      getValue: (container: Container) => container,
      format: (container: Container) => {
        const status = (
          typeof container.State === "string"
            ? container.State
            : (container.State as ContainerState)?.Status || "unknown"
        ).toLowerCase();
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {status !== "running" ? (
              <Tooltip title="Start">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleCommand(container.Id, "start")}
                >
                  <PlayArrowIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Stop">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleCommand(container.Id, "stop")}
                >
                  <StopIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Restart">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleCommand(container.Id, "restart")}
              >
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Logs">
              <IconButton
                size="small"
                color="info"
                onClick={() => handleViewLogs(container.Id, container.Name)}
              >
                <TerminalIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  const toolbarActions = (
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
  );

  const bulkActions = [
    { label: "Start", action: "start" },
    { label: "Stop", action: "stop" },
    { label: "Restart", action: "restart" },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <DataTable
        title="Docker Containers"
        columns={columns}
        rows={containers}
        loading={loading}
        getRowId={(row) => row.Id}
        toolbarActions={toolbarActions}
        onBulkAction={handleBulkAction}
        onBulkDelete={(ids) => handleBulkAction(ids, "rm")}
        bulkActions={bulkActions}
      />

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
