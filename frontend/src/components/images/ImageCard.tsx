import {
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Box,
  Chip,
} from "@mui/material";
import { DockerImage } from "../../services/imageService";
import DeleteIcon from "@mui/icons-material/Delete";
import BuildIcon from "@mui/icons-material/Build";

interface ImageCardProps {
  image: DockerImage;
  onDelete: (id: string) => void;
  onPrune: (id: string) => void;
}

const ImageCard = ({ image, onDelete, onPrune }: ImageCardProps) => {
  const formatSize = (size: string) => {
    const sizeNumber = parseInt(size);
    const gb = sizeNumber / (1024 * 1024 * 1024);
    const mb = sizeNumber / (1024 * 1024);

    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
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
          alignItems="flex-start"
        >
          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 500, mb: 1 }}
            >
              {image.Repository}
            </Typography>
            <Stack direction="row" spacing={1} mb={1}>
              <Chip
                label={image.Tag}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                label={formatSize(image.Size)}
                size="small"
                variant="outlined"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Created: {new Date(image.Created).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => onPrune(image.Id)}
              title="Prune"
            >
              <BuildIcon />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(image.Id)}
              title="Delete"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ImageCard;
