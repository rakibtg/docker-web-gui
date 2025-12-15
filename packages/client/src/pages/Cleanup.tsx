import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import { PageWrapper } from "../components/PageWrapper";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { useApp } from "../hooks/useApp";
import {
  FaRecycle,
  FaBroom,
  FaNetworkWired,
  FaHdd,
  FaShieldAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";

type CleanupActionKey =
  | "prune-containers"
  | "prune-images"
  | "prune-images-all"
  | "prune-networks"
  | "prune-volumes"
  | "system-prune"
  | "system-prune-volumes";

type CleanupAction = {
  id: CleanupActionKey;
  title: string;
  description: string;
  detail: string;
  cta: string;
  icon: ComponentType<{ className?: string }>;
  isDangerous?: boolean;
  confirm: string;
  handler: () => boolean | void;
};

type ActionState = {
  loading: boolean;
  message?: string;
  success?: boolean;
};

const Cleanup = memo(function Cleanup() {
  const {
    setError,
    websocket,
    pruneImages,
    pruneVolumes,
    pruneNetworks,
    pruneContainers,
    systemPrune,
  } = useApp();

  const actions: CleanupAction[] = useMemo(
    () => [
      {
        id: "prune-containers",
        title: "Stopped containers",
        description: "Remove all stopped containers safely.",
        detail: "Running containers stay untouched.",
        cta: "Prune containers",
        icon: FaRecycle,
        confirm:
          "Remove every stopped container. Running containers are never touched.",
        handler: pruneContainers,
      },
      {
        id: "prune-images",
        title: "Dangling images",
        description: "Clean up untagged layers left from builds.",
        detail: "Removes dangling images only.",
        cta: "Prune dangling images",
        icon: HiSparkles,
        confirm:
          "Remove dangling (untagged) images. Tagged or in-use images stay intact.",
        handler: () => pruneImages(false),
      },
      {
        id: "prune-images-all",
        title: "Unused images",
        description: "Delete images not referenced by any container.",
        detail: "Keeps images that are in use.",
        cta: "Prune unused images",
        icon: FaBroom,
        confirm:
          "Remove all images not used by any container. Running containers remain safe.",
        handler: () => pruneImages(true),
      },
      {
        id: "prune-networks",
        title: "Unused networks",
        description: "Drop networks with no attached containers.",
        detail: "Built-in networks are preserved.",
        cta: "Prune networks",
        icon: FaNetworkWired,
        confirm:
          "Prune all unused networks. Default Docker networks (bridge/host/none) are kept.",
        handler: pruneNetworks,
      },
      {
        id: "prune-volumes",
        title: "Unused volumes",
        description: "Remove volumes not referenced by containers.",
        detail: "Data in unused volumes will be deleted.",
        cta: "Prune volumes",
        icon: FaHdd,
        isDangerous: true,
        confirm:
          "Remove all unused volumes. This deletes stored data that is not attached to any container.",
        handler: pruneVolumes,
      },
      {
        id: "system-prune",
        title: "System prune",
        description: "Clean unused containers, networks, and images.",
        detail: "Keeps named volumes intact.",
        cta: "System prune (keep volumes)",
        icon: FaShieldAlt,
        confirm:
          "Run docker system prune. Containers, networks, and images not in use will be removed. Volumes are kept.",
        handler: () => systemPrune(false),
      },
      {
        id: "system-prune-volumes",
        title: "Deep system prune",
        description: "Prune everything unused, including volumes.",
        detail: "Maximum cleanup; volume data removed.",
        cta: "System prune + volumes",
        icon: FaExclamationTriangle,
        isDangerous: true,
        confirm:
          "Run docker system prune including volumes. This can remove unused volumes and their data. Proceed?",
        handler: () => systemPrune(true),
      },
    ],
    [pruneContainers, pruneImages, pruneNetworks, pruneVolumes, systemPrune]
  );

  const [activeActionId, setActiveActionId] = useState<CleanupActionKey | null>(
    null
  );
  const [actionState, setActionState] = useState<
    Record<CleanupActionKey, ActionState>
  >(() =>
    actions.reduce(
      (acc, action) => ({
        ...acc,
        [action.id]: { loading: false, message: "" },
      }),
      {} as Record<CleanupActionKey, ActionState>
    )
  );

  const activeAction = useMemo(
    () => actions.find((action) => action.id === activeActionId) || null,
    [actions, activeActionId]
  );

  const setStatus = useCallback(
    (id: CleanupActionKey, data: Partial<ActionState>) => {
      setActionState((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...data },
      }));
    },
    []
  );

  const resolveActionKey = useCallback(
    (payload: any): CleanupActionKey | null => {
      if (!payload?.action) return null;
      if (payload.action === "prune-images" && payload.scope === "all") {
        return "prune-images-all";
      }
      if (payload.action === "prune-images") {
        return "prune-images";
      }
      if (payload.action === "system-prune" && payload.includeVolumes) {
        return "system-prune-volumes";
      }
      if (payload.action === "system-prune") {
        return "system-prune";
      }
      return payload.action as CleanupActionKey;
    },
    []
  );

  useEffect(() => {
    if (!websocket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type !== "cleanup-result") return;

        const key = resolveActionKey(payload);
        if (!key) return;

        setStatus(key, {
          loading: false,
          success: payload.success,
          message:
            payload.message ||
            (payload.success ? "Cleanup completed" : "Cleanup failed"),
        });
      } catch (error) {
        console.error("Failed to parse cleanup message:", error);
      }
    };

    websocket.addEventListener("message", handleMessage);
    return () => websocket.removeEventListener("message", handleMessage);
  }, [resolveActionKey, setStatus, websocket]);

  const handleConfirm = useCallback(() => {
    if (!activeAction) return;

    const actionId = activeAction.id;
    setActiveActionId(null);
    setStatus(actionId, {
      loading: true,
      success: undefined,
      message: "Running cleanup...",
    });

    const sent = activeAction.handler();
    if (sent === false) {
      setStatus(actionId, {
        loading: false,
        success: false,
        message: "Not connected to the Docker backend",
      });
      setError("Cannot start cleanup - not connected to server");
    }
  }, [activeAction, setError, setStatus]);

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-300">
              Cleanup
            </h2>
            <p className="text-sm text-gray-300">
              Remove unused resources to free disk space. These actions are
              irreversible.
            </p>
          </div>
        </div>

        <div className="text-xs font-bold text-gray-400 border-l-2 border-gray-700 p-2">
          Tip: Run targeted cleanups first (containers/images) before full
          system prune for safer housekeeping.
        </div>

        <div className="space-y-3 max-w-4xl">
          {actions.map((action) => {
            const Icon = action.icon;
            const state = actionState[action.id] || {};

            return (
              <div
                key={action.id}
                className={`border rounded-lg bg-gray-800/60 hover:bg-gray-800/80 transition-colors ${
                  action.isDangerous
                    ? "border-red-800/40"
                    : "border-gray-700/50"
                }`}
              >
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-300" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-100">
                          {action.title}
                        </h3>
                        {action.isDangerous && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-red-200 bg-red-900/40 border border-red-800/50 rounded">
                            <FaExclamationTriangle className="w-2.5 h-2.5" />
                            Destructive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {action.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {action.detail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {state.message && (
                      <div
                        className={`text-xs px-2.5 py-1 rounded ${
                          state.success === false
                            ? "bg-red-900/30 text-red-300 border border-red-800/50"
                            : state.success === true
                            ? "bg-green-900/30 text-green-300 border border-green-800/50"
                            : "bg-gray-700/50 text-gray-300 border border-gray-600/50"
                        }`}
                      >
                        {state.message}
                      </div>
                    )}

                    <button
                      onClick={() => setActiveActionId(action.id)}
                      disabled={state.loading}
                      className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all min-w-56 justify-center ${
                        state.loading
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : action.isDangerous
                          ? "bg-red-800 text-white hover:bg-red-700"
                          : "bg-blue-800 text-white hover:bg-blue-700"
                      }`}
                    >
                      {state.loading && (
                        <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>
                      )}
                      {action.cta}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!activeAction}
        onClose={() => setActiveActionId(null)}
        onConfirm={handleConfirm}
        title={
          activeAction ? `Confirm ${activeAction.title}` : "Confirm cleanup"
        }
        message={
          activeAction?.confirm ||
          "Are you sure you want to run this cleanup action?"
        }
        confirmText="Yes, clean up"
        cancelText="Cancel"
        type="danger"
      />
    </PageWrapper>
  );
});

export { Cleanup };
