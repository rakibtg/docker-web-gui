import { useState, useEffect } from "react";
import {
  Box,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import { DockerImage, imageService } from "../services/imageService";
import { DataTable } from "../components/common/DataTable";
import DeleteIcon from "@mui/icons-material/Delete";
import BuildIcon from "@mui/icons-material/Build";

function ImagesPage() {
  const [images, setImages] = useState<DockerImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await imageService.fetchImages();
      setImages(data);
    } catch (err) {
      setError("Failed to fetch images");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    const interval = setInterval(fetchImages, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCommand = async (imageId: string, command: string) => {
    try {
      await imageService.executeCommand(imageId, command);
      fetchImages();
    } catch (err) {
      setError(`Failed to execute command: ${command}`);
      console.error(err);
    }
  };

  const handleBulkAction = async (selectedIds: string[], action: string) => {
    try {
      await Promise.all(
        selectedIds.map((id) => imageService.executeCommand(id, action))
      );
      fetchImages();
    } catch (err) {
      setError(`Failed to execute bulk action: ${action}`);
      console.error(err);
    }
  };

  const formatSize = (size: string) => {
    const sizeNumber = parseInt(size);
    const gb = sizeNumber / (1024 * 1024 * 1024);
    const mb = sizeNumber / (1024 * 1024);

    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  };

  const columns = [
    {
      id: "repository",
      label: "Repository",
      minWidth: 200,
      getValue: (image: DockerImage) => image.Repository,
    },
    {
      id: "tag",
      label: "Tag",
      minWidth: 130,
      getValue: (image: DockerImage) => image.Tag,
      format: (value: string) => (
        <Chip label={value} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      id: "size",
      label: "Size",
      minWidth: 100,
      getValue: (image: DockerImage) => image.Size,
      format: (value: string) => formatSize(value),
    },
    {
      id: "created",
      label: "Created",
      minWidth: 170,
      getValue: (image: DockerImage) => image.Created,
      format: (value: string) => new Date(value).toLocaleString(),
    },
    {
      id: "actions",
      label: "Actions",
      minWidth: 100,
      align: "right" as const,
      getValue: (image: DockerImage) => image,
      format: (image: DockerImage) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Prune">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleCommand(image.Id, "prune")}
            >
              <BuildIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleCommand(image.Id, "rm")}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const bulkActions = [{ label: "Prune", action: "prune" }];

  return (
    <Box sx={{ p: 3 }}>
      <DataTable
        title="Docker Images"
        columns={columns}
        rows={images}
        loading={loading}
        getRowId={(row) => row.Id}
        onBulkAction={handleBulkAction}
        onBulkDelete={(ids) => handleBulkAction(ids, "rm")}
        bulkActions={bulkActions}
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

export default ImagesPage;
