import { useCallback, useState } from "react";
import type { ContainerGroup } from "../types";

interface GroupInput {
  name: string;
  containerIds: string[];
}

interface GroupsResponse {
  data: ContainerGroup[];
}

interface GroupResponse {
  data: ContainerGroup;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (payload?.message) {
      return payload.message;
    }
    if (payload?.error) {
      return payload.error;
    }
  } catch (error) {
    // ignore parse errors
  }
  return `Request failed (${response.status})`;
}

export function useGroups() {
  const [groups, setGroups] = useState<ContainerGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/groups", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to load groups (${response.status})`);
      }
      const payload = (await response.json()) as GroupsResponse;
      setGroups(Array.isArray(payload.data) ? payload.data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  const createGroup = useCallback(async (input: GroupInput) => {
    setError("");
    const response = await fetch("/api/groups", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const payload = (await response.json()) as GroupResponse;
    setGroups((prev) => [...prev, payload.data]);
    return payload.data;
  }, []);

  const updateGroup = useCallback(async (groupId: number, input: GroupInput) => {
    setError("");
    const response = await fetch(`/api/groups/${groupId}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const payload = (await response.json()) as GroupResponse;
    setGroups((prev) =>
      prev.map((group) => (group.id === groupId ? payload.data : group))
    );
    return payload.data;
  }, []);

  const deleteGroup = useCallback(async (groupId: number) => {
    setError("");
    const response = await fetch(`/api/groups/${groupId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    setGroups((prev) => prev.filter((group) => group.id !== groupId));
  }, []);

  return {
    groups,
    loading,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
