import { Typography, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';

const HistoryPage = () => {
    // This is a placeholder. In a real implementation, you would fetch history from your backend
    const mockHistory = [
        { time: '10:30 AM', event: 'Container nginx_1 started', date: 'Today' },
        { time: '10:29 AM', event: 'Image nginx:latest pulled', date: 'Today' },
        { time: '10:25 AM', event: 'Volume data_volume created', date: 'Today' },
        { time: 'Yesterday', event: 'Container mysql_db stopped', date: 'Yesterday' },
    ];

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                System History
            </Typography>
            
            <List>
                {mockHistory.map((item, index) => (
                    <div key={index}>
                        <ListItem>
                            <ListItemText
                                primary={item.event}
                                secondary={`${item.date} at ${item.time}`}
                            />
                        </ListItem>
                        {index < mockHistory.length - 1 && <Divider />}
                    </div>
                ))}
            </List>
        </Paper>
    );
};

export default HistoryPage;