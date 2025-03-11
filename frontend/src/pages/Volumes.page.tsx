import { useState, useEffect } from "react";
import {
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  Stack,
  Box,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import StorageIcon from "@mui/icons-material/Storage";
import { DockerVolume, volumeService } from "../services/volumeService";
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
    // Refresh every 30 seconds
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

  return (
    <Paper sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" component="h1" sx={{ fontWeight: 500 }}>
          Docker Volumes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          size="medium"
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Volume
        </Button>
      </Stack>

      {loading && <Typography>Loading...</Typography>}

      <Grid container spacing={2}>
        {volumes.map((volume) => (
          <Grid item xs={12} md={6} key={volume.Name}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s ease-in-out, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: (theme) => theme.shadows[4],
                },
              }}
            >
              <CardContent sx={{ flex: 1, p: 2 }}>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <StorageIcon color="primary" />
                    <Typography variant="h6" sx={{ flex: 1 }}>
                      {volume.Name}
                    </Typography>
                    <Tooltip title="Remove Volume">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteVolume(volume.Name)}
                        sx={{
                          "&:hover": {
                            backgroundColor: "error.main",
                            color: "error.contrastText",
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Box sx={{ pl: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Driver: {volume.Driver}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        wordBreak: "break-all",
                      }}
                    >
                      Mountpoint: {volume.Mountpoint}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {!loading && volumes.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary" align="center">
              No volumes found
            </Typography>
          </Grid>
        )}
      </Grid>

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
    </Paper>
  );
};

export default VolumesPage;
