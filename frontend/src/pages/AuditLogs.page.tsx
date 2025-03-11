import { useState, useEffect } from "react";
import { Box, Alert, Snackbar, Chip } from "@mui/material";
import { AuditLog, auditService } from "../services/auditService";
import { DataTable } from "../components/common/DataTable";

const AuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await auditService.fetchLogs();
      setLogs(data);
    } catch (err) {
      setError("Failed to fetch audit logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Refresh every minute
    const interval = setInterval(fetchLogs, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getMethodColor = (
    method: string
  ): "success" | "primary" | "warning" | "error" => {
    switch (method.toUpperCase()) {
      case "GET":
        return "success";
      case "POST":
        return "primary";
      case "PUT":
        return "warning";
      case "DELETE":
        return "error";
      default:
        return "primary";
    }
  };

  const columns = [
    {
      id: "timestamp",
      label: "Timestamp",
      minWidth: 170,
      getValue: (log: AuditLog) => log.created_at,
      format: formatTimestamp,
    },
    {
      id: "method",
      label: "Method",
      minWidth: 100,
      getValue: (log: AuditLog) => log.method,
      format: (value: string) => (
        <Chip
          label={value.toUpperCase()}
          size="small"
          color={getMethodColor(value)}
        />
      ),
    },
    {
      id: "path",
      label: "Path",
      minWidth: 200,
      getValue: (log: AuditLog) => log.path,
    },
    {
      id: "params",
      label: "Parameters",
      minWidth: 200,
      getValue: (log: AuditLog) => log.query_params,
      format: (value: string) => {
        try {
          const params = JSON.parse(value);
          return Object.entries(params)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");
        } catch {
          return value;
        }
      },
    },
    {
      id: "ip",
      label: "IP Address",
      minWidth: 130,
      getValue: (log: AuditLog) => log.ip,
    },
    {
      id: "userAgent",
      label: "User Agent",
      minWidth: 200,
      getValue: (log: AuditLog) => log.user_agent,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <DataTable
        title="Audit Logs"
        columns={columns}
        rows={logs}
        loading={loading}
        getRowId={(row) => row.id.toString()}
        selectable={false}
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

export default AuditLogsPage;
