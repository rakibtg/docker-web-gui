import { API_BASE_URL, endpoints } from "./config";

export interface AuditLog {
  id: number;
  method: string;
  path: string;
  query_params: string;
  body: string;
  ip: string;
  user_agent: string;
  created_at: string;
}

export const auditService = {
  async fetchLogs(): Promise<AuditLog[]> {
    const response = await fetch(`${API_BASE_URL}/audit-logs`);
    if (!response.ok) throw new Error("Failed to fetch audit logs");
    return response.json();
  },
};
