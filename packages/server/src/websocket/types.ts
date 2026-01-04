import { AuthSession } from "../auth";
import type { DockerService } from "../dockerService";

export interface ClientConnection {
  ws: any;
  id: string;
  lastPing: number;
  isActive: boolean;
  session?: AuthSession;
  sessionToken?: string;
  terminals?: Map<string, any>; // terminalId -> terminal process
}

export interface WebSocketContext {
  clients: Map<string, ClientConnection>;
  dockerService: DockerService;
  broadcastToAllClients: (message: object) => void;
  validateContainerIdInput: (containerId: unknown) => string;
}

export interface MessageHandlerArgs {
  ws: any;
  clientId: string;
  clientIP: string;
  parsedMessage: any;
  session?: AuthSession;
  client: ClientConnection;
}

export type MessageHandler = (args: MessageHandlerArgs) => Promise<void> | void;

export type MessageHandlerMap = Record<string, MessageHandler>;
