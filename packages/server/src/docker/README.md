# Docker Services Architecture

This directory contains the refactored Docker service implementation, organized into modular, focused services.

## Structure

```
docker/
├── types.ts                    # Type definitions and interfaces
├── BaseDockerService.ts        # Core Docker utilities and error handling
├── ContainerService.ts         # Container operations (start, stop, restart, get)
├── ImageService.ts             # Image operations (list, remove, history)
├── NetworkService.ts           # Network operations (list, connect, disconnect)
├── VolumeService.ts            # Volume operations (list, remove, prune, details)
├── StatsService.ts             # Real-time statistics streaming
├── TerminalService.ts          # Terminal and logs functionality
└── index.ts                    # Main exports
```

## Services

### BaseDockerService

- **Purpose**: Provides common Docker utilities and error handling
- **Key Features**:
  - Docker availability checking
  - Centralized command execution with error handling
  - Common error message formatting

### ContainerService

- **Purpose**: Manages Docker containers
- **Methods**:
  - `getDockerContainers()`: List all containers
  - `startContainer()`: Start a container
  - `stopContainer()`: Stop a container
  - `restartContainer()`: Restart a container

### ImageService

- **Purpose**: Manages Docker images
- **Methods**:
  - `getDockerImages()`: List all images
  - `removeImage()`: Remove an image
  - `getImageHistory()`: Get image layer history

### NetworkService

- **Purpose**: Manages Docker networks
- **Methods**:
  - `getDockerNetworks()`: List all networks with details
  - `removeDockerNetwork()`: Remove a network

### VolumeService

- **Purpose**: Manages Docker volumes
- **Methods**:
  - `getDockerVolumes()`: List all volumes with usage details
  - `removeDockerVolume()`: Remove a volume
  - `pruneDockerVolumes()`: Remove unused volumes
  - `getDockerVolumeDetails()`: Get detailed volume information

### StatsService

- **Purpose**: Handles real-time container statistics
- **Features**:
  - Real-time stats streaming using `docker stats`
  - Event-driven architecture
  - Automatic stats parsing and container matching

### TerminalService

- **Purpose**: Provides terminal and logging functionality
- **Methods**:
  - `createTerminalSession()`: Create interactive terminal session
  - `createLogsSession()`: Create log streaming session
- **Features**:
  - Shell detection for containers
  - Real-time log streaming with color coding

## Usage

The main `DockerService` class orchestrates all these services while maintaining backward compatibility:

```typescript
import { DockerService } from "./dockerService";

const dockerService = new DockerService();

// All existing methods work the same way
const containers = await dockerService.getDockerContainers();
const images = await dockerService.getDockerImages();
dockerService.startStatsStreaming();
```

## Benefits of Refactoring

1. **Modularity**: Each service has a single responsibility
2. **Maintainability**: Easier to find and modify specific functionality
3. **Testability**: Services can be tested in isolation
4. **Scalability**: Easy to extend with new features
5. **Code Reuse**: Services can be used independently
6. **Better Error Handling**: Centralized error handling in BaseDockerService
7. **Type Safety**: Improved TypeScript types and interfaces

## Backward Compatibility

The refactored code maintains 100% backward compatibility. All existing:

- Method signatures remain the same
- Event emissions work identically
- Error handling patterns are preserved
- Return types are unchanged

## Development Guidelines

When adding new Docker functionality:

1. Add new types to `types.ts`
2. Create new methods in the appropriate service
3. Use `BaseDockerService.execDockerCommand()` for Docker command execution
4. Follow existing error handling patterns
5. Update the main `DockerService` class to expose new functionality
6. Maintain backward compatibility in all changes
