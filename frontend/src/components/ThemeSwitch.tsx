import { IconButton, Menu, MenuItem, ListItemIcon, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useState } from 'react';
import { useColorMode } from '../theme';

const ThemeSwitch = () => {
    const { mode, setMode } = useColorMode();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleModeSelect = (selectedMode: 'light' | 'dark' | 'system') => {
        setMode(selectedMode);
        handleClose();
    };

    const getIcon = () => {
        switch (mode) {
            case 'light': return <Brightness7Icon />;
            case 'dark': return <Brightness4Icon />;
            default: return <SettingsBrightnessIcon />;
        }
    };

    return (
        <>
            <Tooltip title="Change theme">
                <IconButton
                    id="theme-button"
                    aria-controls={open ? 'theme-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleClick}
                    size="small"
                    sx={{ color: 'text.primary' }}
                >
                    {getIcon()}
                </IconButton>
            </Tooltip>
            <Menu
                id="theme-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'theme-button',
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem 
                    onClick={() => handleModeSelect('light')}
                    selected={mode === 'light'}
                >
                    <ListItemIcon>
                        <Brightness7Icon fontSize="small" />
                    </ListItemIcon>
                    Light
                </MenuItem>
                <MenuItem 
                    onClick={() => handleModeSelect('dark')}
                    selected={mode === 'dark'}
                >
                    <ListItemIcon>
                        <Brightness4Icon fontSize="small" />
                    </ListItemIcon>
                    Dark
                </MenuItem>
                <MenuItem 
                    onClick={() => handleModeSelect('system')}
                    selected={mode === 'system'}
                >
                    <ListItemIcon>
                        <SettingsBrightnessIcon fontSize="small" />
                    </ListItemIcon>
                    System
                </MenuItem>
            </Menu>
        </>
    );
};

export default ThemeSwitch;