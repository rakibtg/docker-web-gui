import { recordAction } from "../../audit";
import { MessageHandlerMap, WebSocketContext } from "../types";

export function createImageHandlers(
  context: WebSocketContext
): MessageHandlerMap {
  const { dockerService, broadcastToAllClients } = context;

  return {
    "get-images": async ({ ws }) => {
      try {
        const images = await dockerService.getDockerImages();
        ws.send(
          JSON.stringify({
            type: "images-list",
            data: images,
            timestamp: new Date().toISOString(),
          })
        );
      } catch (error) {
        ws.send(
          JSON.stringify({
            type: "error",
            message:
              error instanceof Error ? error.message : "Failed to get images",
          })
        );
      }
    },
    "get-image-details": async ({ ws, parsedMessage }) => {
      try {
        const { imageId } = parsedMessage;
        if (!imageId) {
          throw new Error("Image ID is required");
        }

        console.log(`Requesting image details for: ${imageId}`);
        const imageDetails = await dockerService.getDockerImageDetails(imageId);
        console.log(`Image details retrieved successfully for: ${imageId}`);
        console.log("Sending image details response:", {
          type: "image-details-result",
          imageId: imageDetails.imageId,
          id: imageDetails.id,
        });

        ws.send(
          JSON.stringify({
            type: "image-details-result",
            data: imageDetails,
            timestamp: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.error(`Error getting image details:`, error);
        ws.send(
          JSON.stringify({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to get Docker image details",
          })
        );
      }
    },
    "remove-image": async ({ ws, parsedMessage, clientIP, session }) => {
      try {
        const { imageId, force } = parsedMessage;
        if (!imageId) {
          throw new Error("Image ID is required");
        }

        const result = await dockerService.removeImage(imageId, force);
        ws.send(
          JSON.stringify({
            type: "image-action-result",
            action: "remove",
            imageId,
            success: result.success,
            message: result.message,
            timestamp: new Date().toISOString(),
          })
        );

        await recordAction("image_remove", {
          session,
          ipAddress: clientIP,
          resourceType: "image",
          resourceId: imageId,
          status: result.success ? "success" : "failed",
          message: result.message,
          metadata: { force: !!force },
        });

        // Refresh images list after action
        if (result.success) {
          setTimeout(async () => {
            try {
              const images = await dockerService.getDockerImages();
              broadcastToAllClients({
                type: "images-list",
                data: images,
                timestamp: new Date().toISOString(),
              });
            } catch (error) {
              console.error("Error refreshing images after remove:", error);
            }
          }, 1000);
        }
      } catch (error) {
        await recordAction("image_remove", {
          session,
          ipAddress: clientIP,
          resourceType: "image",
          resourceId: parsedMessage?.imageId,
          status: "error",
          message:
            error instanceof Error ? error.message : "Failed to remove image",
        });
        ws.send(
          JSON.stringify({
            type: "error",
            message:
              error instanceof Error ? error.message : "Failed to remove image",
          })
        );
      }
    },
    "get-image-history": async ({ ws, parsedMessage }) => {
      try {
        const { imageId } = parsedMessage;
        if (!imageId) {
          throw new Error("Image ID is required");
        }

        const result = await dockerService.getImageHistory(imageId);
        ws.send(
          JSON.stringify({
            type: "image-history-result",
            imageId,
            success: result.success,
            data: result.data,
            message: result.message,
            timestamp: new Date().toISOString(),
          })
        );
      } catch (error) {
        ws.send(
          JSON.stringify({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to get image history",
          })
        );
      }
    },
    "prune-images": async ({ ws, parsedMessage, clientIP, session }) => {
      try {
        const { all } = parsedMessage;
        const result = await dockerService.pruneImages(!!all);
        ws.send(
          JSON.stringify({
            type: "cleanup-result",
            action: "prune-images",
            scope: result.data?.scope || (all ? "all" : "dangling"),
            success: result.success,
            message: result.message,
            data: result.data,
            timestamp: new Date().toISOString(),
          })
        );

        await recordAction("images_prune", {
          session,
          ipAddress: clientIP,
          resourceType: "image",
          status: result.success ? "success" : "failed",
          message: result.message,
          metadata: {
            scope: result.data?.scope || (all ? "all" : "dangling"),
            reclaimed: result.data?.SpaceReclaimed,
          },
        });

        if (result.success) {
          setTimeout(async () => {
            try {
              const images = await dockerService.getDockerImages();
              broadcastToAllClients({
                type: "images-list",
                data: images,
                timestamp: new Date().toISOString(),
              });
            } catch (error) {
              console.error("Error refreshing images after prune:", error);
            }
          }, 500);
        }
      } catch (error) {
        await recordAction("images_prune", {
          session,
          ipAddress: clientIP,
          resourceType: "image",
          status: "error",
          message:
            error instanceof Error ? error.message : "Failed to prune images",
        });
        ws.send(
          JSON.stringify({
            type: "cleanup-result",
            action: "prune-images",
            success: false,
            scope: parsedMessage?.all ? "all" : "dangling",
            message:
              error instanceof Error ? error.message : "Failed to prune images",
            timestamp: new Date().toISOString(),
          })
        );
      }
    },
  };
}
