import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface TerminalProps {
  terminalId: string; // Unique terminal session ID
  containerId: string;
  containerName: string;
  websocket: WebSocket;
}

export function Terminal({
  terminalId,
  containerId,
  containerName,
  websocket,
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const connectionRequestedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!terminalRef.current) return;

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
    }

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

  <div className="flex flex-col h-[calc(100vh-54vh)]">
    <div className="flex-1 pl-2 pt-0.5 border border-gray-600 bg-[#181e2d]">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  </div>;
}
