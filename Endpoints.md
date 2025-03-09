# Docker Web GUI API Endpoints

## Default Endpoint

- `GET /` - Serves the default web interface

## Container Endpoints

- `GET /api/container/fetch`

  - Description: Fetches all containers
  - Query Params:
    - `status` (optional): Filter containers by status ('active', 'all', 'stopped')
  - Returns: Array of container details sorted by name

- `GET /api/container/fetchById`

  - Description: Fetches details of a specific container
  - Query Params:
    - `container`: Container ID
  - Returns: Detailed information about the specified container

- `GET /api/container/command`

  - Description: Executes a command on a specific container
  - Query Params:
    - `container`: Container ID
    - `command`: Command to execute
  - Returns: Command output

- `GET /api/container/logs`

  - Description: Retrieves logs for a specific container
  - Query Params:
    - `container`: Container ID
  - Returns: Container logs

- `GET /api/container/stats`
  - Description: Retrieves statistics for containers
  - Returns: Array of container statistics

## Image Endpoints

- `GET /api/image/fetch`

  - Description: Fetches all Docker images
  - Returns: Array of formatted image details

- `GET /api/image/command`
  - Description: Executes a command on a specific image
  - Query Params:
    - `image`: Image ID
    - `command`: Command to execute
  - Returns: Command output

## Group Endpoints

- `POST /api/groups`

  - Description: Creates a new container group
  - Body Params:
    - `name`: Group name
    - `containers`: Array of container IDs
  - Returns: Group creation response

- `GET /api/groups`

  - Description: Fetches all container groups
  - Returns: Array of group details

- `DELETE /api/groups`
  - Description: Deletes a container group
  - Body Params:
    - `id`: Group ID to delete
  - Returns: Empty array

## Generic Command Endpoint

- `GET /api/generic`
  - Description: Executes generic Docker commands

## Cleanup Endpoint

- `GET /api/cleanup/command`
  - Description: Executes cleanup commands for Docker resources
