import { getDatabase } from "./db/connection";

interface ContainerGroupRow {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ContainerGroup {
  id: number;
  name: string;
  containerIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface GroupContainerRow {
  group_id: number;
  container_id: string;
}

function normalizeContainerIds(containerIds: string[]): string[] {
  const unique = new Set<string>();
  for (const id of containerIds) {
    const trimmed = id.trim();
    if (trimmed) {
      unique.add(trimmed);
    }
  }
  return Array.from(unique);
}

function mapGroupRow(
  group: ContainerGroupRow,
  containerIds: string[]
): ContainerGroup {
  return {
    id: group.id,
    name: group.name,
    containerIds,
    createdAt: group.created_at,
    updatedAt: group.updated_at,
  };
}

export async function listGroups(): Promise<ContainerGroup[]> {
  const db = getDatabase();
  const groups: ContainerGroupRow[] = await db("container_groups")
    .select("id", "name", "created_at", "updated_at")
    .orderBy("name", "asc");

  if (groups.length === 0) {
    return [];
  }

  const groupIds = groups.map((group) => group.id);
  const mappings: GroupContainerRow[] = await db("group_containers")
    .select("group_id", "container_id")
    .whereIn("group_id", groupIds)
    .orderBy("container_id", "asc");

  const containersByGroup = new Map<number, string[]>();
  for (const mapping of mappings) {
    const list = containersByGroup.get(mapping.group_id) ?? [];
    list.push(mapping.container_id);
    containersByGroup.set(mapping.group_id, list);
  }

  return groups.map((group) =>
    mapGroupRow(group, containersByGroup.get(group.id) ?? [])
  );
}

export async function createGroup(
  name: string,
  containerIds: string[]
): Promise<ContainerGroup> {
  const db = getDatabase();
  const normalizedIds = normalizeContainerIds(containerIds);

  const result = await db.transaction(async (trx) => {
    const [groupId] = await trx("container_groups").insert({
      name,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    });

    if (normalizedIds.length > 0) {
      await trx("group_containers").insert(
        normalizedIds.map((containerId) => ({
          group_id: groupId,
          container_id: containerId,
          created_at: trx.fn.now(),
        }))
      );
    }

    const createdGroup: ContainerGroupRow | undefined = await trx(
      "container_groups"
    )
      .select("id", "name", "created_at", "updated_at")
      .where({ id: groupId })
      .first();

    if (!createdGroup) {
      throw new Error("Failed to create group");
    }

    return mapGroupRow(createdGroup, normalizedIds);
  });

  return result;
}

export async function updateGroup(
  groupId: number,
  name: string,
  containerIds: string[]
): Promise<ContainerGroup | null> {
  const db = getDatabase();
  const normalizedIds = normalizeContainerIds(containerIds);

  return db.transaction(async (trx) => {
    const existing: ContainerGroupRow | undefined = await trx(
      "container_groups"
    )
      .select("id", "name", "created_at", "updated_at")
      .where({ id: groupId })
      .first();

    if (!existing) {
      return null;
    }

    await trx("container_groups")
      .where({ id: groupId })
      .update({
        name,
        updated_at: trx.fn.now(),
      });

    await trx("group_containers").where({ group_id: groupId }).del();

    if (normalizedIds.length > 0) {
      await trx("group_containers").insert(
        normalizedIds.map((containerId) => ({
          group_id: groupId,
          container_id: containerId,
          created_at: trx.fn.now(),
        }))
      );
    }

    const updatedGroup: ContainerGroupRow | undefined = await trx(
      "container_groups"
    )
      .select("id", "name", "created_at", "updated_at")
      .where({ id: groupId })
      .first();

    if (!updatedGroup) {
      return null;
    }

    return mapGroupRow(updatedGroup, normalizedIds);
  });
}

export async function deleteGroup(groupId: number): Promise<boolean> {
  const db = getDatabase();
  const deleted = await db("container_groups").where({ id: groupId }).del();
  return deleted > 0;
}
