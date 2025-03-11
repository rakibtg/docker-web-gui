import { Typography, Paper, Card, CardContent, Grid, Button, Stack, Box, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import StorageIcon from '@mui/icons-material/Storage';

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
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    size="medium"
                >
                    Create Volume
                </Button>
            </Stack>
            
            <Grid container spacing={2}>
                {mockVolumes.map((volume) => (
                    <Grid item xs={12} md={6} key={volume.name}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s ease-in-out',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                }
                            }}
                        >
                            <CardContent sx={{ flex: 1, p: 2 }}>
                                <Stack spacing={2}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <StorageIcon color="primary" />
                                        <Typography variant="h6" sx={{ flex: 1 }}>
                                            {volume.name}
                                        </Typography>
                                        <Tooltip title="Remove Volume">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                sx={{
                                                    '&:hover': {
                                                        backgroundColor: 'error.main',
                                                        color: 'error.contrastText',
                                                    }
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                    <Box sx={{ pl: 4 }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Driver: {volume.driver}
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary"
                                            sx={{
                                                wordBreak: 'break-all'
                                            }}
                                        >
                                            Mountpoint: {volume.mountpoint}
                                        </Typography>
                                    </Box>
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