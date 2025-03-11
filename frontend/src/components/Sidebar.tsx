import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Stack } from "@mui/material";
import { NavLink } from "react-router";
import StorageIcon from '@mui/icons-material/Storage';
import ImageIcon from '@mui/icons-material/Image';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InfoIcon from '@mui/icons-material/Info';
import ThemeSwitch from "./ThemeSwitch";

const Sidebar = () => {
    return (
        <Box sx={{ pt: 2, height: '100%' }}>
            <Stack direction="row" sx={{ px: 2, mb: 3 }} alignItems="center" justifyContent="space-between">
                <Typography variant="h6" component="div">
                    Docker GUI
                </Typography>
                <ThemeSwitch />
            </Stack>
            <List>
                <ListItem disablePadding>
                    <ListItemButton
                        component={NavLink}
                        to="/container"
                        sx={{
                            '&.active': {
                                bgcolor: 'action.selected',
                            }
                        }}
                    >
                        <ListItemIcon>
                            <StorageIcon />
                        </ListItemIcon>
                        <ListItemText primary="Containers" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        component={NavLink}
                        to="/image"
                        sx={{
                            '&.active': {
                                bgcolor: 'action.selected',
                            }
                        }}
                    >
                        <ListItemIcon>
                            <ImageIcon />
                        </ListItemIcon>
                        <ListItemText primary="Images" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        component={NavLink}
                        to="/volume"
                        sx={{
                            '&.active': {
                                bgcolor: 'action.selected',
                            }
                        }}
                    >
                        <ListItemIcon>
                            <VolumeUpIcon />
                        </ListItemIcon>
                        <ListItemText primary="Volumes" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        component={NavLink}
                        to="/audit"
                        sx={{
                            '&.active': {
                                bgcolor: 'action.selected',
                            }
                        }}
                    >
                        <ListItemIcon>
                            <AssignmentIcon />
                        </ListItemIcon>
                        <ListItemText primary="Audit Logs" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        component={NavLink}
                        to="/history"
                        sx={{
                            '&.active': {
                                bgcolor: 'action.selected',
                            }
                        }}
                    >
                        <ListItemIcon>
                            <HistoryIcon />
                        </ListItemIcon>
                        <ListItemText primary="History" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        component={NavLink}
                        to="/about"
                        sx={{
                            '&.active': {
                                bgcolor: 'action.selected',
                            }
                        }}
                    >
                        <ListItemIcon>
                            <InfoIcon />
                        </ListItemIcon>
                        <ListItemText primary="About" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );
}

export default Sidebar;