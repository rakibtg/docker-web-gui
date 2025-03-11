import { Typography, Paper, Card, CardContent, Stack, Box } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';

const HistoryPage = () => {
    const mockHistory = [
        { time: '10:30 AM', event: 'Container nginx_1 started', date: 'Today', type: 'container' },
        { time: '10:29 AM', event: 'Image nginx:latest pulled', date: 'Today', type: 'image' },
        { time: '10:25 AM', event: 'Volume data_volume created', date: 'Today', type: 'volume' },
        { time: 'Yesterday', event: 'Container mysql_db stopped', date: 'Yesterday', type: 'container' },
    ];

    const getEventColor = (type: string) => {
        switch (type) {
            case 'container': return 'primary.main';
            case 'image': return 'secondary.main';
            case 'volume': return 'success.main';
            default: return 'text.secondary';
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                System History
            </Typography>
            
            <Stack spacing={2} sx={{ mt: 3, position: 'relative' }}>
                {/* Vertical timeline line */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: '7px',
                        top: '10px',
                        bottom: '10px',
                        width: '2px',
                        bgcolor: 'divider',
                    }}
                />
                
                {mockHistory.map((item, index) => (
                    <Box key={index} sx={{ position: 'relative' }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                            <CircleIcon 
                                sx={{ 
                                    fontSize: 16, 
                                    color: getEventColor(item.type),
                                    bgcolor: 'background.paper',
                                    borderRadius: '50%',
                                }} 
                            />
                            <Card 
                                sx={{ 
                                    flex: 1,
                                    boxShadow: 'none',
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body1">
                                            {item.event}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {item.date} at {item.time}
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Stack>
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
};

export default HistoryPage;