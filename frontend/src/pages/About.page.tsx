import { Typography, Paper, Box, Grid, Card, CardContent, Stack } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import ImageIcon from '@mui/icons-material/Image';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIcon from '@mui/icons-material/Assignment';

const AboutPage = () => {
    const features = [
        { title: 'Container Management', icon: <StorageIcon color="primary" fontSize="large" />, description: 'Manage Docker containers with ease' },
        { title: 'Image Management', icon: <ImageIcon color="secondary" fontSize="large" />, description: 'Pull, push, and manage Docker images' },
        { title: 'Volume Management', icon: <VolumeUpIcon color="success" fontSize="large" />, description: 'Handle Docker volumes efficiently' },
        { title: 'Audit Logging', icon: <AssignmentIcon color="info" fontSize="large" />, description: 'Track all system activities' },
        { title: 'System History', icon: <HistoryIcon color="warning" fontSize="large" />, description: 'View historical operations' },
    ];

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                <Typography variant="h4" gutterBottom align="center">
                    About Docker GUI
                </Typography>
                <Typography 
                    paragraph 
                    align="center" 
                    color="text.secondary"
                    sx={{ mb: 6, mt: 2 }}
                >
                    A modern, intuitive interface for managing Docker containers, images, and volumes.
                    Built with performance and user experience in mind.
                </Typography>

                <Grid container spacing={3}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card 
                                sx={{ 
                                    height: '100%',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                    }
                                }}
                            >
                                <CardContent>
                                    <Stack 
                                        spacing={2} 
                                        alignItems="center" 
                                        sx={{ textAlign: 'center' }}
                                    >
                                        {feature.icon}
                                        <Typography variant="h6" gutterBottom>
                                            {feature.title}
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary"
                                        >
                                            {feature.description}
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Paper>
    );
};

export default AboutPage;