import { createTheme, ThemeProvider, useMediaQuery } from '@mui/material';
import { createContext, useContext, useMemo, useState, useEffect } from 'react';

type ColorMode = 'light' | 'dark' | 'system';
interface ColorModeContextType {
    mode: ColorMode;
    setMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
    mode: 'system',
    setMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useState<ColorMode>('system');
    const [effectiveMode, setEffectiveMode] = useState<'light' | 'dark'>(prefersDarkMode ? 'dark' : 'light');

    useEffect(() => {
        setEffectiveMode(mode === 'system' ? (prefersDarkMode ? 'dark' : 'light') : mode);
    }, [mode, prefersDarkMode]);

    const colorMode = useMemo(
        () => ({
            mode,
            setMode,
        }),
        [mode]
    );

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: effectiveMode,
                    primary: {
                        main: '#2196f3',
                        light: '#64b5f6',
                        dark: '#1976d2',
                    },
                    secondary: {
                        main: '#f50057',
                        light: '#ff4081',
                        dark: '#c51162',
                    },
                    background: {
                        default: effectiveMode === 'dark' ? '#121212' : '#f8f9fa',
                        paper: effectiveMode === 'dark' ? '#1e1e1e' : '#ffffff',
                    },
                    text: {
                        primary: effectiveMode === 'dark' ? '#ffffff' : '#2c3e50',
                        secondary: effectiveMode === 'dark' ? '#b0bec5' : '#546e7a',
                    }
                },
                shape: {
                    borderRadius: 8,
                },
                spacing: 8,
                typography: {
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                    h4: {
                        fontWeight: 500,
                        fontSize: '1.75rem',
                        color: effectiveMode === 'dark' ? '#ffffff' : '#2c3e50',
                    },
                    h6: {
                        fontWeight: 500,
                        color: effectiveMode === 'dark' ? '#ffffff' : '#2c3e50',
                    },
                    button: {
                        textTransform: 'none',
                        fontWeight: 500,
                    },
                },
                components: {
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                backgroundImage: 'none',
                                boxShadow: effectiveMode === 'dark' 
                                    ? '0 2px 8px 0 rgba(0,0,0,0.3)' 
                                    : '0 2px 8px 0 rgba(0,0,0,0.1)',
                            },
                        },
                    },
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                borderRadius: 6,
                            },
                        },
                    },
                    MuiListItemButton: {
                        styleOverrides: {
                            root: {
                                borderRadius: 6,
                                margin: '0 8px',
                                width: 'calc(100% - 16px)',
                            },
                        },
                    },
                    MuiListItemText: {
                        styleOverrides: {
                            primary: {
                                color: effectiveMode === 'dark' ? '#ffffff' : '#2c3e50',
                            },
                            secondary: {
                                color: effectiveMode === 'dark' ? '#b0bec5' : '#546e7a',
                            },
                        },
                    },
                },
            }),
        [effectiveMode]
    );

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </ColorModeContext.Provider>
    );
}
