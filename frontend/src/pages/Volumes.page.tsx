import { Typography, Paper, Card, CardContent, Grid, Button, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const VolumesPage = () => {
    // This is a placeholder. In a real implementation, you would fetch volumes from your backend
    const mockVolumes = [
        { name: 'data_volume', mountpoint: '/var/lib/docker/volumes/data_volume/_data', driver: 'local' },
        { name: 'mysql_data', mountpoint: '/var/lib/docker/volumes/mysql_data/_data', driver: 'local' },
    ];

    return (
        <Paper sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">
                    Volumes
                </Typography>
                <Button variant="contained" color="primary">
                    Create Volume
                </Button>
            </Stack>
            
            <Grid container spacing={3}>
                {mockVolumes.map((volume) => (
                    <Grid item xs={12} key={volume.name}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <div>
                                        <Typography variant="h6" gutterBottom>
                                            {volume.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Driver: {volume.driver}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Mountpoint: {volume.mountpoint}
                                        </Typography>
                                    </div>
                                    <Button
                                        startIcon={<DeleteIcon />}
                                        color="error"
                                        variant="outlined"
                                        size="small"
                                    >
                                        Remove
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
};

export default VolumesPage;