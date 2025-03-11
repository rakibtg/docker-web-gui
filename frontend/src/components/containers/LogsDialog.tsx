import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from "@mui/material";

interface LogsDialogProps {
  open: boolean;
  onClose: () => void;
  logs: string;
  containerName: string;
}

const LogsDialog = ({
  open,
  onClose,
  logs,
  containerName,
}: LogsDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: "80vh",
        },
      }}
    >
      <DialogTitle>Logs: {containerName}</DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            bgcolor: "background.paper",
            p: 2,
            borderRadius: 1,
            fontFamily: "monospace",
            fontSize: "0.875rem",
            overflow: "auto",
            maxHeight: "calc(80vh - 130px)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {logs || "No logs available"}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogsDialog;
