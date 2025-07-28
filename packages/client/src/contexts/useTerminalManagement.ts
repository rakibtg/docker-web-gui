import type { TerminalSession } from "./types";
import { useCallback, useRef, useEffect, useState } from "react";

interface UseTerminalManagementProps {
  websocket: WebSocket | null;
  terminals: TerminalSession[];
  setShowTerminals: React.Dispatch<React.SetStateAction<boolean>>;
  setTerminals: React.Dispatch<React.SetStateAction<TerminalSession[]>>;
  setActiveTerminalId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useTerminalManagement({
  terminals,
  websocket,
  setTerminals,
  setShowTerminals,
  setActiveTerminalId,
}: UseTerminalManagementProps) {
  // Terminal management functions
  const addTerminal = useCallback(
    (containerId: string, containerName: string) => {
      const id = `terminal-${containerId}-${Date.now()}`;
      const newTerminal: TerminalSession = {
        id,
        containerId,
        containerName,
        isActive: true,
        type: "terminal",
      };

      setTerminals((prev) => [...prev, newTerminal]);
      setActiveTerminalId(id);
      setShowTerminals(true);
    },
    [setTerminals, setActiveTerminalId, setShowTerminals]
  );

  const addLogs = useCallback(
    (containerId: string, containerName: string) => {
      const id = `logs-${containerId}-${Date.now()}`;
      const newLogsSession: TerminalSession = {
        id,
        containerId,
        containerName,
        isActive: true,
        type: "logs",
      };

      setTerminals((prev) => [...prev, newLogsSession]);
      setActiveTerminalId(id);
      setShowTerminals(true);
    },
    [setTerminals, setActiveTerminalId, setShowTerminals]
  );

  const removeTerminal = useCallback(
    (terminalId: string) => {
      setTerminals((prev) => prev.filter((t) => t.id !== terminalId));

      // Update active terminal if needed
      setActiveTerminalId((currentActive) => {
        if (currentActive === terminalId) {
          const filtered = terminals.filter((t) => t.id !== terminalId);
          const lastTerminal = filtered[filtered.length - 1];
          return lastTerminal ? lastTerminal.id : null;
        }
        return currentActive;
      });
    },
    [terminals, setTerminals, setActiveTerminalId]
  );

  const closeTerminal = useCallback(
    (terminalId: string) => {
      const terminal = terminals.find((t) => t.id === terminalId);
      if (terminal && websocket?.readyState === WebSocket.OPEN) {
        const disconnectType =
          terminal.type === "logs" ? "logs-disconnect" : "terminal-disconnect";
        websocket.send(
          JSON.stringify({
            type: disconnectType,
            terminalId: terminal.id, // Use terminalId instead of containerId
            containerId: terminal.containerId,
          })
        );
      }

      removeTerminal(terminalId);

      // Check if this was the last terminal
      const remainingTerminals = terminals.filter((t) => t.id !== terminalId);
      if (remainingTerminals.length === 0) {
        setShowTerminals(false);
        setActiveTerminalId(null);
      }
    },
    [
      terminals,
      websocket,
      removeTerminal,
      setShowTerminals,
      setActiveTerminalId,
    ]
  );

  const closeAllTerminals = useCallback(() => {
    // Close all terminals with proper websocket disconnection
    terminals.forEach((terminal) => {
      if (websocket?.readyState === WebSocket.OPEN) {
        const disconnectType =
          terminal.type === "logs" ? "logs-disconnect" : "terminal-disconnect";
        websocket.send(
          JSON.stringify({
            type: disconnectType,
            terminalId: terminal.id,
            containerId: terminal.containerId,
          })
        );
      }
    });

    // Clear all terminals from state
    setTerminals([]);
    setActiveTerminalId(null);
    setShowTerminals(false);
  }, [
    terminals,
    websocket,
    setTerminals,
    setActiveTerminalId,
    setShowTerminals,
  ]);

  return {
    addLogs,
    addTerminal,
    closeTerminal,
    removeTerminal,
    closeAllTerminals,
  };
}

// Custom hook to calculate available width for tabs container
export function useTabsContainerWidth(terminalsCount: number) {
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [tabsWidth, setTabsWidth] = useState<number | null>(null);

  const calculateWidth = useCallback(() => {
    if (!headerRef.current || !tabsContainerRef.current) return;

    const headerElement = headerRef.current;
    const headerWidth = headerElement.offsetWidth;

    // Calculate space taken by minimize button (approx 44px including margins)
    const minimizeButtonWidth = 44;

    // Calculate space taken by padding/margins on header (px-2 = 16px)
    const headerPadding = 16;

    // Calculate available width for tabs
    const availableWidth = headerWidth - minimizeButtonWidth - headerPadding;

    const newWidth = Math.max(availableWidth, 200); // Minimum width of 200px

    // Debug logging to track width changes
    console.log("TerminalManager width calculation:", {
      headerWidth,
      availableWidth,
      newWidth,
      timestamp: new Date().toISOString(),
    });

    setTabsWidth(newWidth);
  }, []);

  useEffect(() => {
    calculateWidth();

    // Recalculate on window resize
    const handleResize = () => {
      calculateWidth();
    };

    window.addEventListener("resize", handleResize);

    // Use ResizeObserver to detect layout changes (like sidebar collapse)
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    if (headerRef.current) {
      // Watch for size changes on the header element
      resizeObserver = new ResizeObserver(() => {
        // Use setTimeout to avoid infinite loops and debounce
        setTimeout(calculateWidth, 50);
      });
      resizeObserver.observe(headerRef.current);

      // Find and observe the sidebar element
      const sidebarElement = document.querySelector("aside");
      if (sidebarElement) {
        resizeObserver.observe(sidebarElement);
      }

      // Find and observe the main content area
      const mainContentElement = document.querySelector("div.flex-grow");
      if (mainContentElement) {
        resizeObserver.observe(mainContentElement);
      }

      // Also watch for transitions on the sidebar that might indicate collapse/expand
      mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "class"
          ) {
            const target = mutation.target as Element;
            // Check if the changed element is related to sidebar width
            if (
              target.classList.contains("w-16") ||
              target.classList.contains("w-64") ||
              target.closest("aside") ||
              target.tagName === "ASIDE"
            ) {
              setTimeout(calculateWidth, 100);
            }
          }
        });
      });

      // Watch for class changes on the sidebar element specifically
      if (sidebarElement) {
        mutationObserver.observe(sidebarElement, {
          attributes: true,
          attributeFilter: ["class"],
          subtree: true,
        });
      }
    }

    // Also recalculate when terminals count changes (in case of layout changes)
    const timeoutId = setTimeout(calculateWidth, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      clearTimeout(timeoutId);
    };
  }, [calculateWidth, terminalsCount]);

  return { headerRef, tabsContainerRef, tabsWidth };
}
