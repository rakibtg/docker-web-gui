import { useState, useEffect } from "react";
import { Box, Typography, Grid, Alert, Snackbar } from "@mui/material";
import { DockerImage, imageService } from "../services/imageService";
import ImageCard from "../components/images/ImageCard";

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
    // Refresh every 30 seconds
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3, fontWeight: 500 }}>
        Docker Images
      </Typography>

      {loading && <Typography>Loading...</Typography>}

      <Grid container spacing={2}>
        {images.map((image) => (
          <Grid item xs={12} sm={6} md={4} key={image.Id}>
            <ImageCard
              image={image}
              onDelete={(id) => handleCommand(id, "rm")}
              onPrune={(id) => handleCommand(id, "prune")}
            />
          </Grid>
        ))}
        {!loading && images.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary" align="center">
              No images found
            </Typography>
          </Grid>
        )}
      </Grid>

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
