import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import { useState } from "react";

interface CreateVolumeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

const CreateVolumeDialog = ({
  open,
  onClose,
  onSubmit,
}: CreateVolumeDialogProps) => {
  const [volumeName, setVolumeName] = useState("");

  const handleSubmit = () => {
    if (volumeName) {
      onSubmit(volumeName);
      setVolumeName("");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create New Volume</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Volume Name"
          fullWidth
          value={volumeName}
          onChange={(e) => setVolumeName(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={!volumeName}
          variant="contained"
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateVolumeDialog;
