import { useCallback } from "react";
import type { ImageHistoryState } from "./types";

interface UseDockerActionsProps {
  sendMessage: (message: object) => boolean;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setImagesLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setNetworksLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setVolumesLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setImageHistory: React.Dispatch<React.SetStateAction<ImageHistoryState>>;
}

export function useDockerActions({
  setError,
  setLoading,
  sendMessage,
  setImageHistory,
  setImagesLoading,
  setVolumesLoading,
  setNetworksLoading,
}: UseDockerActionsProps) {
  // Function to request containers list
  const requestContainers = useCallback(() => {
    setLoading(true);
    setError("");
    const sent = sendMessage({ type: "get-containers" });
    if (!sent) {
      setLoading(false);
      setError("Cannot send request - not connected to server");
    }
  }, [sendMessage, setLoading, setError]);

  // Function to request images list
  const requestImages = useCallback(() => {
    setImagesLoading(true);
    setError("");
    const sent = sendMessage({ type: "get-images" });
    if (!sent) {
      setImagesLoading(false);
      setError("Cannot send request - not connected to server");
    }
  }, [sendMessage, setImagesLoading, setError]);

  // Function to request networks list
  const requestNetworks = useCallback(() => {
    setNetworksLoading(true);
    setError("");
    const sent = sendMessage({ type: "get-networks" });
    if (!sent) {
      setNetworksLoading(false);
      setError("Cannot send request - not connected to server");
    }
  }, [sendMessage, setNetworksLoading, setError]);

  // Function to request volumes list
  const requestVolumes = useCallback(() => {
    setVolumesLoading(true);
    setError("");
    const sent = sendMessage({ type: "get-volumes" });
    if (!sent) {
      setVolumesLoading(false);
      setError("Cannot send request - not connected to server");
    }
  }, [sendMessage, setVolumesLoading, setError]);

  // Function to request specific volume details
  const requestVolumeDetails = useCallback(
    (volumeName: string) => {
      setVolumesLoading(true);
      setError("");
      const sent = sendMessage({ type: "get-volume-details", volumeName });
      if (!sent) {
        setVolumesLoading(false);
        setError("Cannot send request - not connected to server");
      }
    },
    [sendMessage, setVolumesLoading, setError]
  );

  // Function to request specific container details
  const requestContainerDetails = useCallback(
    (containerId: string) => {
      setLoading(true);
      setError("");
      const sent = sendMessage({ type: "get-container-details", containerId });
      if (!sent) {
        setLoading(false);
        setError("Cannot send request - not connected to server");
      }
    },
    [sendMessage, setLoading, setError]
  );

  // Function to request specific image details
  const requestImageDetails = useCallback(
    (imageId: string) => {
      setImagesLoading(true);
      setError("");
      const sent = sendMessage({ type: "get-image-details", imageId });
      if (!sent) {
        setImagesLoading(false);
        setError("Cannot send request - not connected to server");
      }
    },
    [sendMessage, setImagesLoading, setError]
  );

  // Function to remove an image
  const handleImageRemove = useCallback(
    (imageId: string, force: boolean = false) => {
      sendMessage({
        type: "remove-image",
        imageId: imageId,
        force: force,
      });
    },
    [sendMessage]
  );

  // Function to remove a network
  const handleNetworkRemove = useCallback(
    (networkId: string, networkName?: string) => {
      sendMessage({
        type: "remove-network",
        networkId: networkId,
        networkName: networkName,
      });
    },
    [sendMessage]
  );

  // Function to remove a volume
  const handleVolumeRemove = useCallback(
    (volumeName: string) => {
      sendMessage({
        type: "remove-volume",
        volumeName: volumeName,
      });
    },
    [sendMessage]
  );

  // Function to get image history
  const getImageHistory = useCallback(
    (imageId: string, imageName: string) => {
      setImageHistory((prev) => ({
        ...prev,
        imageId,
        imageName,
        loading: true,
        isOpen: true,
        layers: [],
      }));

      sendMessage({
        type: "get-image-history",
        imageId: imageId,
      });
    },
    [sendMessage, setImageHistory]
  );

  // Function to close image history modal
  const closeImageHistory = useCallback(() => {
    setImageHistory((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, [setImageHistory]);

  // Function to toggle container state
  const handleContainerToggle = useCallback(
    (containerId: string, currentState: string) => {
      const action =
        currentState === "running" ? "stop-container" : "start-container";
      console.log(
        `${action === "stop-container" ? "Stopping" : "Starting"} container:`,
        containerId
      );

      sendMessage({
        type: action,
        containerId: containerId,
      });
    },
    [sendMessage]
  );

  const handleContainerRestart = useCallback(
    (containerId: string) => {
      sendMessage({
        type: "restart-container",
        containerId: containerId,
      });
    },
    [sendMessage]
  );

  const handleContainerRemove = useCallback(
    (containerId: string) => {
      sendMessage({
        type: "remove-container",
        containerId: containerId,
      });
    },
    [sendMessage]
  );

  const pruneContainers = useCallback(() => {
    return sendMessage({
      type: "prune-containers",
    });
  }, [sendMessage]);

  const pruneImages = useCallback(
    (all: boolean = false) => {
      return sendMessage({
        type: "prune-images",
        all,
      });
    },
    [sendMessage]
  );

  const pruneNetworks = useCallback(() => {
    return sendMessage({
      type: "prune-networks",
    });
  }, [sendMessage]);

  const pruneVolumes = useCallback(() => {
    return sendMessage({
      type: "prune-volumes",
    });
  }, [sendMessage]);

  const systemPrune = useCallback(
    (includeVolumes: boolean = false) => {
      return sendMessage({
        type: "system-prune",
        includeVolumes,
      });
    },
    [sendMessage]
  );

  return {
    requestImages,
    requestVolumes,
    requestNetworks,
    getImageHistory,
    requestContainers,
    handleImageRemove,
    closeImageHistory,
    handleVolumeRemove,
    handleNetworkRemove,
    requestVolumeDetails,
    handleContainerToggle,
    handleContainerRestart,
    handleContainerRemove,
    pruneContainers,
    pruneImages,
    pruneNetworks,
    pruneVolumes,
    systemPrune,
    requestContainerDetails,
    requestImageDetails,
  };
}
