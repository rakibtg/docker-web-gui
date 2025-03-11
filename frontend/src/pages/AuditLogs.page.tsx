import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';

const AuditLogsPage = () => {
    const mockLogs = [
        { timestamp: '2024-01-20 10:30:00', action: 'Container Start', user: 'system', details: 'Started container: nginx', status: 'success' },
        { timestamp: '2024-01-20 10:29:00', action: 'Image Pull', user: 'system', details: 'Pulled image: nginx:latest', status: 'success' },
        { timestamp: '2024-01-20 10:28:00', action: 'Container Stop', user: 'system', details: 'Stopped container: mysql', status: 'warning' },
        { timestamp: '2024-01-20 10:27:00', action: 'Volume Delete', user: 'system', details: 'Failed to delete volume: in use', status: 'error' },
    ];

    const getChipColor = (status: string) => {
        switch (status) {
            case 'success': return 'success';
            case 'warning': return 'warning';
            case 'error': return 'error';
            default: return 'default';
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Audit Logs
            </Typography>
            <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Details</TableCell>
                            <TableCell align="right">Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockLogs.map((log, index) => (
                            <TableRow 
                                key={index}
                                sx={{ 
                                    '&:last-child td, &:last-child th': { border: 0 },
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                    }
                                }}
                            >
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {log.timestamp}
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    <Typography variant="body2" fontWeight="medium">
                                        {log.action}
                                    </Typography>
                                </TableCell>
                                <TableCell>{log.user}</TableCell>
                                <TableCell sx={{ maxWidth: '300px' }}>
                                    <Typography noWrap>{log.details}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Chip 
                                        label={log.status}
                                        size="small"
                                        color={getChipColor(log.status)}
                                        sx={{ 
                                            textTransform: 'capitalize',
                                            minWidth: '80px'
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default AuditLogsPage;