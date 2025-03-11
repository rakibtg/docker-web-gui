import { createTheme, ThemeProvider, useMediaQuery } from '@mui/material';
import { createContext, useContext, useMemo, useState } from 'react';

type ColorMode = 'light' | 'dark' | 'system';
interface ColorModeContextType {
    mode: ColorMode;
    toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
    mode: 'system',
    toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useState<ColorMode>('system');

    const colorMode = useMemo(
        () => ({
            mode,
            toggleColorMode: () => {
                setMode((prevMode) => {
                    if (prevMode === 'system') return 'light';
                    if (prevMode === 'light') return 'dark';
                    return 'system';
                });
            },
        }),
        [mode]
    );

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: mode === 'system' ? (prefersDarkMode ? 'dark' : 'light') : mode,
                },
            }),
        [mode, prefersDarkMode]
    );

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </ColorModeContext.Provider>
    );
}
