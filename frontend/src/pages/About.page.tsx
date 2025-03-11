import { Typography, Paper, Box } from '@mui/material';

const AboutPage = () => {
    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                About Docker GUI
            </Typography>
            <Box sx={{ mt: 2 }}>
                <Typography paragraph>
                    Docker GUI is a web-based interface for managing Docker containers, images, and volumes.
                    It provides an easy-to-use interface for common Docker operations.
                </Typography>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Features
                </Typography>
                <Typography component="ul" sx={{ pl: 2 }}>
                    <li>Container Management</li>
                    <li>Image Management</li>
                    <li>Volume Management</li>
                    <li>Audit Logging</li>
                    <li>System History</li>
                </Typography>
            </Box>
        </Paper>
    );
};

export default AboutPage;