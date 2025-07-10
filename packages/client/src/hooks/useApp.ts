import { useContext } from "react";
import { AppContext, type AppContextType } from "../contexts/AppContext";

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
