import { useTheme } from "../hooks/useTheme";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-3 rounded-lg border-theme border bg-theme-card text-theme-secondary hover:bg-theme-button transition-colors"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        // Moon icon for dark mode
        <HiOutlineMoon className="w-5 h-5" />
      ) : (
        // Sun icon for light mode
        <HiOutlineSun className="w-5 h-5" />
      )}
    </button>
  );
}
