import {
  memo,
  useMemo,
  useState,
  useEffect,
  useCallback,
  type FormEvent,
} from "react";

import {
  ContainerGrid,
  CardActionButton,
  ConfirmationModal,
} from "../components";

import { useApp } from "../hooks/useApp";
import { MdRefresh } from "react-icons/md";
import { MdModeEdit } from "react-icons/md";
import { useGroups } from "../hooks/useGroups";
import { IoReloadCircle } from "react-icons/io5";
import { useTerminal } from "../hooks/useTerminal";
import SearchInput from "../components/SearchInput";
import { PageWrapper } from "../components/PageWrapper";
import { HiChevronDown, HiChevronRight } from "react-icons/hi";
import { FaPlay, FaStop, FaTrash, FaTimes } from "react-icons/fa";
import type { ContainerGroup, ContainerWithStats } from "../types";

const BYTES_PER_KIB = 1024;
const BYTES_PER_MIB = BYTES_PER_KIB * 1024;
const BYTES_PER_GIB = BYTES_PER_MIB * 1024;
const BYTES_PER_TIB = BYTES_PER_GIB * 1024;

const MEMORY_UNITS: Record<string, number> = {
  B: 1,
  kB: 1000,
  KB: 1000,
  MB: 1000 ** 2,
  GB: 1000 ** 3,
  TB: 1000 ** 4,
  KiB: BYTES_PER_KIB,
  MiB: BYTES_PER_MIB,
  GiB: BYTES_PER_GIB,
  TiB: BYTES_PER_TIB,
};

function parseCpuPercent(value?: string): number {
  if (!value) {
    return 0;
  }
  const match = value.match(/[\d.]+/);
  if (!match) {
    return 0;
  }
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseMemoryBytes(value?: string): number {
  if (!value) {
    return 0;
  }
  const usedPart = value.split("/")[0]?.trim();
  if (!usedPart) {
    return 0;
  }
  const match = usedPart.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
  if (!match) {
    return 0;
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier = MEMORY_UNITS[unit] ?? 1;
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return amount * multiplier;
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let adjusted = value;
  let unitIndex = 0;
  while (adjusted >= BYTES_PER_KIB && unitIndex < units.length - 1) {
    adjusted /= BYTES_PER_KIB;
    unitIndex += 1;
  }
  const precision = adjusted >= 10 || unitIndex === 0 ? 0 : 1;
  return `${adjusted.toFixed(precision)} ${units[unitIndex]}`;
}

type GroupActionTarget = {
  group: ContainerGroup;
  type: "delete-group" | "delete-containers";
};

const Groups = memo(function Groups() {
  const {
    loading,
    containers,
    requestContainers,
    handleContainerToggle,
    handleContainerRemove,
    handleContainerRestart,
  } = useApp();

  const { openTerminal, openLogs } = useTerminal();

  const {
    groups,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    error: groupsError,
    loading: groupsLoading,
  } = useGroups();

  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [containerSearch, setContainerSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [pendingAction, setPendingAction] = useState<GroupActionTarget | null>(
    null
  );

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (containers.length === 0) {
      requestContainers();
    }
  }, [containers.length, requestContainers]);

  const containerById = useMemo(() => {
    return new Map<string, ContainerWithStats>(
      containers.map((container) => [container.id, container])
    );
  }, [containers]);

  const filteredContainers = useMemo(() => {
    if (!containerSearch.trim()) {
      return containers;
    }
    const term = containerSearch.toLowerCase();
    return containers.filter(
      (container) =>
        container.name.toLowerCase().includes(term) ||
        container.id.toLowerCase().includes(term)
    );
  }, [containers, containerSearch]);

  const missingSelections = useMemo(() => {
    return Array.from(selectedIds).filter((id) => !containerById.has(id));
  }, [selectedIds, containerById]);

  const resetForm = useCallback(() => {
    setFormName("");
    setFormError("");
    setSelectedIds(new Set());
    setEditingGroupId(null);
    setContainerSearch("");
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    resetForm();
  }, [resetForm]);

  const openCreateForm = useCallback(() => {
    resetForm();
    setIsFormOpen(true);
  }, [resetForm]);

  const handleEditGroup = useCallback((group: ContainerGroup) => {
    setFormName(group.name);
    setSelectedIds(new Set(group.containerIds));
    setEditingGroupId(group.id);
    setFormError("");
    setContainerSearch("");
    setIsFormOpen(true);
  }, []);

  const toggleContainerSelection = useCallback((containerId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(containerId)) {
        next.delete(containerId);
      } else {
        next.add(containerId);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setFormError("");
      const trimmed = formName.trim();
      if (!trimmed) {
        setFormError("Group name is required.");
        return;
      }
      const payload = {
        name: trimmed,
        containerIds: Array.from(selectedIds),
      };
      try {
        if (editingGroupId) {
          await updateGroup(editingGroupId, payload);
        } else {
          await createGroup(payload);
        }
        await fetchGroups();
        closeForm();
      } catch (error: any) {
        setFormError(error?.message || "Failed to save group");
      }
    },
    [
      formName,
      selectedIds,
      editingGroupId,
      updateGroup,
      createGroup,
      fetchGroups,
      closeForm,
    ]
  );

  const toggleExpanded = useCallback((groupId: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const handleGroupToggle = useCallback(
    (groupContainers: ContainerWithStats[], stopRunning: boolean) => {
      groupContainers.forEach((container) => {
        if (stopRunning && container.state !== "running") {
          return;
        }
        if (!stopRunning && container.state === "running") {
          return;
        }
        handleContainerToggle(container.id, container.state);
      });
    },
    [handleContainerToggle]
  );

  const handleGroupRestart = useCallback(
    (groupContainers: ContainerWithStats[]) => {
      groupContainers.forEach((container) => {
        handleContainerRestart(container.id);
      });
    },
    [handleContainerRestart]
  );

  const confirmGroupDeletion = useCallback((group: ContainerGroup) => {
    setPendingAction({ group, type: "delete-group" });
  }, []);

  const handleConfirmAction = useCallback(async () => {
    if (!pendingAction) {
      return;
    }
    const { group, type } = pendingAction;
    if (type === "delete-group") {
      await deleteGroup(group.id);
      await fetchGroups();
    } else if (type === "delete-containers") {
      const groupContainers = group.containerIds
        .map((id) => containerById.get(id))
        .filter((container): container is ContainerWithStats =>
          Boolean(container)
        );
      groupContainers.forEach((container) => {
        handleContainerRemove(container.id);
      });
    }
    setPendingAction(null);
  }, [
    pendingAction,
    deleteGroup,
    fetchGroups,
    containerById,
    handleContainerRemove,
  ]);

  const handleOpenTerminal = useCallback(
    (containerId: string, containerName: string) => {
      openTerminal(containerId, containerName);
    },
    [openTerminal]
  );

  const handleOpenLogs = useCallback(
    (containerId: string, containerName: string) => {
      openLogs(containerId, containerName);
    },
    [openLogs]
  );

  const groupCards = useMemo(() => {
    if (groupsLoading) {
      return (
        <div className="text-gray-400 text-sm py-8 text-center">
          Loading groups...
        </div>
      );
    }

    if (groupsError && groups.length === 0) {
      return (
        <div className="text-red-300 text-sm py-8 text-center">
          {groupsError}
        </div>
      );
    }

    if (groups.length === 0) {
      return (
        <div className="text-gray-400 text-sm py-8 text-center">
          No groups created yet.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {groups.map((group) => {
          const groupContainers = group.containerIds
            .map((id) => containerById.get(id))
            .filter((container): container is ContainerWithStats =>
              Boolean(container)
            );
          const missingCount =
            group.containerIds.length - groupContainers.length;
          const isExpanded = expandedGroups.has(group.id);
          const hasRunning = groupContainers.some(
            (container) => container.state === "running"
          );
          const hasStopped = groupContainers.some(
            (container) => container.state !== "running"
          );
          const showMixedIcons = hasRunning && hasStopped;
          const toggleLabel = hasRunning ? "Stop" : "Start";
          const totalCpu = groupContainers.reduce((total, container) => {
            return total + parseCpuPercent(container.stats?.cpuPerc);
          }, 0);
          const totalMemoryBytes = groupContainers.reduce(
            (total, container) => {
              return total + parseMemoryBytes(container.stats?.memUsage);
            },
            0
          );

          return (
            <div
              key={group.id}
              className="bg-gray-800 border border-gray-600 rounded-sm p-2"
            >
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => toggleExpanded(group.id)}
                  className="flex items-center gap-2 text-gray-100 hover:text-white transition-colors"
                >
                  {isExpanded ? (
                    <HiChevronDown className="h-5 w-5" />
                  ) : (
                    <HiChevronRight className="h-5 w-5" />
                  )}
                  <div className="text-left">
                    <div className="text-sm font-semibold">{group.name}</div>
                    <div className="text-xs text-gray-400">
                      {groupContainers.length} containers
                      {missingCount > 0 ? ` · ${missingCount} missing` : ""}
                    </div>
                  </div>
                </button>

                <div className="text-xs text-gray-400 flex items-center gap-2 pl-2">
                  <span>CPU {totalCpu.toFixed(1)}%</span>
                  <span className="text-gray-600">•</span>
                  <span>Memory {formatBytes(totalMemoryBytes)}</span>
                </div>

                <div className="flex items-center space-x-4 ml-auto">
                  <CardActionButton
                    title={
                      hasRunning
                        ? "Stop running containers in group"
                        : "Start containers in group"
                    }
                    aria-label={
                      hasRunning
                        ? "Stop running containers in group"
                        : "Start containers in group"
                    }
                    onClick={() =>
                      handleGroupToggle(groupContainers, hasRunning)
                    }
                    disabled={groupContainers.length === 0}
                  >
                    {showMixedIcons ? (
                      <div className="flex items-center gap-1">
                        <FaStop className="h-4 w-4" />
                      </div>
                    ) : hasRunning ? (
                      <FaStop className="h-5 w-5" />
                    ) : (
                      <FaPlay className="h-5 w-5" />
                    )}
                    <p className="text-xs text-gray-100 pt-1">
                      {toggleLabel} All
                    </p>
                  </CardActionButton>

                  <CardActionButton
                    title="Restart containers in group"
                    aria-label="Restart containers in group"
                    onClick={() => handleGroupRestart(groupContainers)}
                    disabled={groupContainers.length === 0}
                  >
                    <IoReloadCircle className="h-6 w-6" />
                    <p className="text-xs text-gray-100 pt-1">Restart All</p>
                  </CardActionButton>

                  <CardActionButton
                    title="Edit group"
                    aria-label="Edit group"
                    onClick={() => handleEditGroup(group)}
                  >
                    <MdModeEdit className="h-5 w-5" />
                    <p className="text-xs text-gray-100 pt-1">Edit Group</p>
                  </CardActionButton>

                  <CardActionButton
                    title="Delete group"
                    aria-label="Delete group"
                    onClick={() => confirmGroupDeletion(group)}
                    className="w-24"
                  >
                    <FaTrash className="h-5 w-5" />
                    <p className="text-xs text-gray-100 pt-1">Delete Group</p>
                  </CardActionButton>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pl-6">
                  {groupContainers.length > 0 ? (
                    <ContainerGrid
                      containers={groupContainers}
                      onContainerToggle={handleContainerToggle}
                      onContainerRestart={handleContainerRestart}
                      onContainerRemove={handleContainerRemove}
                      onOpenTerminal={handleOpenTerminal}
                      onOpenLogs={handleOpenLogs}
                    />
                  ) : (
                    <div className="text-sm text-gray-400 py-6">
                      No containers available for this group.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }, [
    groups,
    groupsLoading,
    groupsError,
    containerById,
    expandedGroups,
    toggleExpanded,
    handleGroupToggle,
    handleGroupRestart,
    handleContainerToggle,
    handleContainerRestart,
    handleContainerRemove,
    handleOpenTerminal,
    handleOpenLogs,
    confirmGroupDeletion,
    handleEditGroup,
  ]);

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-300">
              Groups
            </h2>
            <button
              title="Refresh Groups"
              onClick={fetchGroups}
              className="h-7 w-7 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:cursor-pointer transition-colors flex justify-center items-center"
            >
              <MdRefresh className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreateForm}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Create new group
            </button>
          </div>
        </div>

        <section>{groupCards}</section>
      </div>

      {isFormOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={closeForm}
        >
          <div
            className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl w-full max-w-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-gray-100">
                {editingGroupId ? "Edit group" : "Create a new group"}
              </h3>
              <button
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-200 transition-colors"
                aria-label="Close group form"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-2">
                  Group name
                </label>
                <input
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Core Services"
                />
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-2">
                  Select containers
                </div>
                <div className="mb-3">
                  <SearchInput
                    value={containerSearch}
                    onChange={setContainerSearch}
                    placeholder="Search containers..."
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {filteredContainers.length === 0 ? (
                    <div className="text-sm text-gray-500 py-4 text-center">
                      No containers available.
                    </div>
                  ) : (
                    filteredContainers.map((container) => (
                      <label
                        key={container.id}
                        className="flex items-center gap-3 bg-gray-900/70 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 hover:border-gray-600"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(container.id)}
                          onChange={() =>
                            toggleContainerSelection(container.id)
                          }
                          className="h-4 w-4 accent-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{container.name}</div>
                          <div className="text-xs text-gray-400">
                            {container.image}
                          </div>
                        </div>
                        <span
                          className={`text-xs ${
                            container.state === "running"
                              ? "text-green-400"
                              : "text-gray-400"
                          }`}
                        >
                          {container.state}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {missingSelections.length > 0 && (
                  <div className="mt-3 text-xs text-yellow-300 space-y-1">
                    <div>Missing containers:</div>
                    <div className="flex flex-wrap gap-2">
                      {missingSelections.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleContainerSelection(id)}
                          className="px-2 py-1 rounded bg-yellow-900/40 border border-yellow-700/60 text-yellow-200 hover:bg-yellow-900/60"
                          title="Remove missing container from group"
                        >
                          {id.slice(0, 12)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {formError && (
                <div className="text-sm text-red-300">{formError}</div>
              )}
              {groupsError && (
                <div className="text-sm text-red-300">{groupsError}</div>
              )}

              <div className="flex flex-wrap items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => requestContainers()}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-700 text-gray-100 hover:bg-gray-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Refresh containers
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-700 text-gray-100 hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={groupsLoading}
                >
                  {editingGroupId ? "Save group" : "Create group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        title={
          pendingAction?.type === "delete-group"
            ? "Delete group"
            : "Delete containers"
        }
        message={
          pendingAction?.type === "delete-group"
            ? "This will permanently delete the group."
            : "This will permanently delete all containers in the group."
        }
        isOpen={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
        confirmText={
          pendingAction?.type === "delete-group" ? "Delete group" : "Delete"
        }
        type={pendingAction?.type === "delete-group" ? "danger" : "warning"}
      />
    </PageWrapper>
  );
});

export { Groups };
