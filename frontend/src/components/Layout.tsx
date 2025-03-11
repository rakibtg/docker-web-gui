import { Box, Container } from "@mui/material";
import { Outlet } from "react-router";
import Sidebar from "./Sidebar";

const DRAWER_WIDTH = 240;

const Layout = () => {
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Box
                component="nav"
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                }}
            >
                <Sidebar />
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: `calc(100% - ${DRAWER_WIDTH}px)`
                }}
            >
                <Container maxWidth="xl">
                    <Outlet />
                </Container>
            </Box>
        </Box>
    );
};

export default Layout;