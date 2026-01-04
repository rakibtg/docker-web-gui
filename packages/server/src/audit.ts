import logger from "./logger";
import { AuthSession } from "./auth";

interface LogContext {
  userId: string | null;
  username: string | null;
  isAnonymous: boolean;
}

function createLogContext(session?: AuthSession | null): LogContext {
  if (session) {
    return {
      userId: session.userId || session.username,
      username: session.username,
      isAnonymous: false,
    };
  }
  return {
    userId: null,
    username: null,
    isAnonymous: true,
  };
}

export async function recordAction(
  action: string,
  options: {
    message?: string;
    status?: string;
    metadata?: Record<string, any>;
    session?: AuthSession | null;
    ipAddress?: string | null;
    resourceType?: string | null;
    resourceId?: string | null;
  } = {}
): Promise<void> {
  const context = createLogContext(options.session);
  try {
    await logger.logAction({
      action,
      message: options.message ?? null,
      status: options.status ?? null,
      metadata: options.metadata ?? null,
      userId: context.userId,
      username: context.username,
      isAnonymous: context.isAnonymous,
      ipAddress: options.ipAddress ?? null,
      resourceType: options.resourceType ?? null,
      resourceId: options.resourceId ?? null,
    });
  } catch (error) {
    console.warn("Failed to log action:", error);
  }
}
