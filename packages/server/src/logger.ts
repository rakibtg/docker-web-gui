import { Knex } from "knex";
import { getDatabase, initializeDatabase } from "./db/connection";

export interface LogEntryInput {
  action: string;
  message?: string | null;
  userId?: string | null;
  username?: string | null;
  ipAddress?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  status?: string | null;
  metadata?: Record<string, any> | null;
  isAnonymous?: boolean;
}

export interface LogEntry extends LogEntryInput {
  id: number;
  createdAt: string;
  isAnonymous: boolean;
}

export interface LogQueryOptions {
  limit?: number;
  offset?: number;
  action?: string;
  userId?: string;
  status?: string;
}

export class LoggerService {
  private db: Knex;

  constructor(db: Knex = getDatabase()) {
    this.db = db;
  }

  async logAction(entry: LogEntryInput): Promise<number> {
    await initializeDatabase();
    const isAnonymous = entry.isAnonymous ?? (!entry.userId && !entry.username);
    const [id] = await this.db("action_logs").insert({
      action: entry.action,
      message: entry.message ?? null,
      user_id: entry.userId ?? null,
      username: entry.username ?? null,
      is_anonymous: isAnonymous,
      ip_address: entry.ipAddress ?? null,
      resource_type: entry.resourceType ?? null,
      resource_id: entry.resourceId ?? null,
      status: entry.status ?? null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    });

    return typeof id === "object" && id !== null ? (id as any).id : Number(id);
  }

  async getLogs(options: LogQueryOptions = {}): Promise<LogEntry[]> {
    await initializeDatabase();
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
    const offset = Math.max(options.offset ?? 0, 0);

    const rows = await this.db("action_logs")
      .modify((queryBuilder) => {
        if (options.action) {
          queryBuilder.where("action", options.action);
        }
        if (options.userId) {
          queryBuilder.where("user_id", options.userId);
        }
        if (options.status) {
          queryBuilder.where("status", options.status);
        }
      })
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    return rows.map((row: any) => {
      let parsedMetadata: Record<string, any> | null = null;
      if (row.metadata) {
        try {
          parsedMetadata = JSON.parse(row.metadata);
        } catch {
          parsedMetadata = null;
        }
      }

      return {
        id: row.id,
        action: row.action,
        message: row.message,
        userId: row.user_id,
        username: row.username,
        ipAddress: row.ip_address,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        status: row.status,
        metadata: parsedMetadata,
        isAnonymous: !!row.is_anonymous,
        createdAt: row.created_at,
      };
    });
  }
}

const logger = new LoggerService();

export default logger;
