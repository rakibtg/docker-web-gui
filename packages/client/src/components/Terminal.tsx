import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface TerminalProps {
  terminalId: string; // Unique terminal session ID
  containerId: string;
  containerName: string;
  onClose: () => void;
  websocket: WebSocket;
  isEmbedded?: boolean;
}

export function Terminal({
  terminalId,
  containerId,
  containerName,
  onClose,
  websocket,
  isEmbedded = false,
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const connectionRequestedRef = useRef<boolean>(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;
    // Create terminal instance
    const terminal = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      theme: {
        background: "#181e2d",
        foreground: "#d4d4d4",
        cursor: "#d4d4d4",
        selectionBackground: "#264f78",
        black: "#000000",
        red: "#cd3131",
        green: "#0dbc79",
        yellow: "#e5e510",
        blue: "#2472c8",
        magenta: "#bc3fbc",
        cyan: "#11a8cd",
        white: "#e5e5e5",
        brightBlack: "#666666",
        brightRed: "#f14c4c",
        brightGreen: "#23d18b",
        brightYellow: "#f5f543",
        brightBlue: "#3b8eea",
        brightMagenta: "#d670d6",
        brightCyan: "#29b8db",
        brightWhite: "#e5e5e5",
      },
    });

    // Create addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    // Load addons
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    // Open terminal
    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Store references
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle terminal input
    terminal.onData((data) => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(
          JSON.stringify({
            type: "terminal-input",
            terminalId,
            containerId,
            data,
          })
        );
      }
    });

    // Request terminal connection only once
    if (
      websocket.readyState === WebSocket.OPEN &&
      !connectionRequestedRef.current
    ) {
      connectionRequestedRef.current = true;
      websocket.send(
        JSON.stringify({
          type: "terminal-connect",
          terminalId,
          containerId,
        })
      );
      // Set connected state immediately since we don't wait for server confirmation
      setIsConnected(true);
    }

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(
          JSON.stringify({
            type: "terminal-resize",
            terminalId,
            containerId,
            cols: terminal.cols,
            rows: terminal.rows,
          })
        );
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      terminal.dispose();
    };
  }, [terminalId, containerId, websocket]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (
          message.type === "terminal-data" &&
          message.terminalId === terminalId
        ) {
          if (xtermRef.current) {
            xtermRef.current.write(message.data);
          }
        } else if (
          message.type === "terminal-disconnected" &&
          message.terminalId === terminalId
        ) {
          setIsConnected(false);
          if (xtermRef.current) {
            xtermRef.current.write(
              "\r\n\x1b[31mTerminal disconnected\x1b[0m\r\n"
            );
          }
        } else if (
          message.type === "terminal-error" &&
          message.terminalId === terminalId
        ) {
          if (xtermRef.current) {
            xtermRef.current.write(
              "\r\n\x1b[31mError: " + message.error + "\x1b[0m\r\n"
            );
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.addEventListener("message", handleMessage);

    return () => {
      websocket.removeEventListener("message", handleMessage);
    };
  }, [terminalId, containerId, containerName, websocket]);

  const handleClose = () => {
    // Send disconnect signal
    if (websocket.readyState === WebSocket.OPEN) {
      websocket.send(
        JSON.stringify({
          type: "terminal-disconnect",
          terminalId,
          containerId,
        })
      );
    }
    onClose();
  };

  return isEmbedded ? (
    // Embedded mode - no modal overlay
    <div className="flex flex-col h-full">
      {/* Terminal */}
      <div className="flex-1 pl-2 border border-gray-600 bg-[#181e2d]">
        <div ref={terminalRef} className="w-full h-[calc(100vh-56.5vh)]" />
      </div>
    </div>
  ) : (
    // Modal mode - original layout
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[90vw] h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-4">
              Terminal - {containerName}
            </span>
            {isConnected && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Connected
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
            title="Close terminal"
            aria-label="Close terminal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Terminal */}
        <div className="flex-1 p-2 bg-[#181e2d]">
          <div ref={terminalRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
