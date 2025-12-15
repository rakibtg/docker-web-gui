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
  username?: string;
  ipAddress?: string;
  isAnonymous?: boolean;
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

  async getLogs(options: LogQueryOptions = {}): Promise<{ logs: LogEntry[]; total: number }> {
    await initializeDatabase();
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
    const offset = Math.max(options.offset ?? 0, 0);

    const baseQuery = this.db("action_logs").modify((queryBuilder) => {
      if (options.action) {
        queryBuilder.where("action", options.action);
      }
      if (options.userId) {
        queryBuilder.where("user_id", options.userId);
      }
      if (options.username) {
        queryBuilder.where((qb) => {
          qb.where("username", options.username).orWhere("user_id", options.username);
        });
      }
      if (options.status) {
        queryBuilder.where("status", options.status);
      }
      if (options.ipAddress) {
        queryBuilder.where("ip_address", options.ipAddress);
      }
      if (typeof options.isAnonymous === "boolean") {
        queryBuilder.where("is_anonymous", options.isAnonymous);
      }
    });

    const countResult = await baseQuery.clone().count({ count: "*" });
    const totalRaw = (countResult as any)?.[0]?.count ?? (countResult as any)?.[0]?.["count(*)"];
    const total = typeof totalRaw === "string" ? parseInt(totalRaw, 10) : Number(totalRaw || 0);

    const rows = await baseQuery
      .clone()
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    const logs = rows.map((row: any) => {
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

    return { logs, total };
  }
}

const logger = new LoggerService();

export default logger;
