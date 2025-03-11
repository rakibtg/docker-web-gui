import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const AuditLogsPage = () => {
    // This is a placeholder. In a real implementation, you would fetch audit logs from your backend
    const mockLogs = [
        { timestamp: '2024-01-20 10:30:00', action: 'Container Start', user: 'system', details: 'Started container: nginx' },
        { timestamp: '2024-01-20 10:29:00', action: 'Image Pull', user: 'system', details: 'Pulled image: nginx:latest' },
    ];

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Audit Logs
            </Typography>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockLogs.map((log, index) => (
                            <TableRow key={index}>
                                <TableCell>{log.timestamp}</TableCell>
                                <TableCell>{log.action}</TableCell>
                                <TableCell>{log.user}</TableCell>
                                <TableCell>{log.details}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default AuditLogsPage;