import { useState, useEffect } from "react";
import {
  Box,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { DockerVolume, volumeService } from "../services/volumeService";
import { DataTable } from "../components/common/DataTable";
import CreateVolumeDialog from "../components/volumes/CreateVolumeDialog";

const VolumesPage = () => {
  const [volumes, setVolumes] = useState<DockerVolume[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchVolumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await volumeService.fetchVolumes();
      setVolumes(data);
    } catch (err) {
      setError("Failed to fetch volumes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumes();
    const interval = setInterval(fetchVolumes, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateVolume = async (name: string) => {
    try {
      await volumeService.createVolume(name);
      setCreateDialogOpen(false);
      fetchVolumes();
    } catch (err) {
      setError("Failed to create volume");
      console.error(err);
    }
  };

  const handleDeleteVolume = async (name: string) => {
    try {
      await volumeService.removeVolume(name);
      fetchVolumes();
    } catch (err) {
      setError("Failed to delete volume");
      console.error(err);
    }
  };

  const handleBulkDelete = async (selectedNames: string[]) => {
    try {
      await Promise.all(
        selectedNames.map((name) => volumeService.removeVolume(name))
      );
      fetchVolumes();
    } catch (err) {
      setError("Failed to delete volumes");
      console.error(err);
    }
  };

  const columns = [
    {
      id: "name",
      label: "Name",
      minWidth: 170,
      getValue: (volume: DockerVolume) => volume.Name,
    },
    {
      id: "driver",
      label: "Driver",
      minWidth: 130,
      getValue: (volume: DockerVolume) => volume.Driver,
      format: (value: string) => (
        <Chip label={value} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      id: "mountpoint",
      label: "Mountpoint",
      minWidth: 300,
      getValue: (volume: DockerVolume) => volume.Mountpoint,
      format: (value: string) => (
        <Tooltip title={value}>
          <Typography
            variant="body2"
            sx={{
              maxWidth: "300px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      minWidth: 100,
      align: "right" as const,
      getValue: (volume: DockerVolume) => volume,
      format: (volume: DockerVolume) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteVolume(volume.Name)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const toolbarActions = (
    <Tooltip title="Create Volume">
      <IconButton color="primary" onClick={() => setCreateDialogOpen(true)}>
        <AddIcon />
      </IconButton>
    </Tooltip>
  );

  return (
    <Box sx={{ p: 3 }}>
      <DataTable
        title="Docker Volumes"
        columns={columns}
        rows={volumes}
        loading={loading}
        getRowId={(row) => row.Name}
        toolbarActions={toolbarActions}
        onBulkDelete={handleBulkDelete}
      />

      <CreateVolumeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateVolume}
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
};

export default VolumesPage;
