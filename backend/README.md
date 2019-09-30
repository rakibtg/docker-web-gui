## Backend API

- Get a list of containers
  - Endpoint: `/api/container/fetch?status=active`
  - Method: `GET`
  - Query Params: 
    - `status` 
      - Value: `all`, `active`, `stopped` 
      - default: `active`
  - Response: A list of containers
    ```JSON
    [
      {
        "Id": "19ea7e796993c1b3486ffa4207994ef7e9cf7844072c6760970375b89e96d45c",
        "shortId": "19ea7e796993",
        "Created": "2019-08-27T15:44:09.8723696Z",
        "State": {
          "Status": "exited",
          "Running": false,
          "Paused": false,
          "Restarting": false,
          "OOMKilled": false,
          "Dead": false,
          "Pid": 0,
          "ExitCode": 100,
          "Error": "",
          "StartedAt": "2019-08-27T15:44:10.5869722Z",
          "FinishedAt": "2019-08-27T15:44:29.0294127Z"
        },
        "Name": "/goofy_antonelli"
      },
      {...},
      {...}
    ]
    ```

- Get a container by ID
  - Endpoint: `/api/container/fetchById?container=container-id`
  - Method: `GET`
  - Query Params:
    - `container`
      - Value: `container-id` ex: 3da3ad7b90e3
  - Response: An object contained information's about the container
    ```JSON
    {
      "Id": "3da3ad7b90e321fbf0fd2466d2555a7092c0642e7ad07fbe5d623fa0c6f65ada",
      "shortId": "3da3ad7b90e3",
      "Created": "2019-08-27T16:11:57.4812983Z",
      "State": {
        "Status": "running",
        "Running": true,
        "Paused": false,
        "Restarting": false,
        "OOMKilled": false,
        "Dead": false,
        "Pid": 2660,
        "ExitCode": 0,
        "Error": "",
        "StartedAt": "2019-08-31T04:25:12.807509894Z",
        "FinishedAt": "2019-08-31T04:25:07.825047009Z"
      },
      "Name": "/dinky-dank-docker_web_1"
    }
    ```

- Run generic command to a specific container
  - Endpoint: `/api/container/command?container=container-id&command=start`
  - Method: `GET`
  - Query Params:
    - `container`
      - Value: `container-id` ex: 3da3ad7b90e3
    - `command`
      - Value: `start`, `stop`, `restart` etc
  - Response: It might return the container id most of the time. It could be different based on the command.
    ```
    "3da3ad7b90e3"
    ```

- Get system consumption stats of all active containers
  - Endpoint: `/api/container/stats`
  - Method: `GET`
  - Response: List of status for active containers
    ```JSON
    [
      {
        "id": "3da3ad7b90e3",
        "cpu_percentage": "0.01%",
        "memory_usage": "9.77MiB / 1.952GiB",
        "network_io": "998B / 0B"
      },
      {...},
      {...}
    ]
    ```

- Get text log of a container
  - Endpoint: `/api/container/logs?container=container-id`
  - Method: `GET`
  - Query Params:
    - `container`
      - Value: `container-id` ex: 3da3ad7b90e3
  - Response: String with special characters like new lines, tabs etc
    ```
    "172.18.0.1 - - 
    [27/Aug/2019:16:13:01 +0000] \"POST /api/v1/actions/upload/ HTTP/1.1\" 200 1357 \"-\" \"insomnia/6.6.2\"\n172.18.0.1 - - 
    [27/Aug/2019:16:28:36 +0000] \"POST /api/v1/actions/upload/ HTTP/1.1\" 200 1522 \"-\" \"insomnia/6.6.2\"\n172.18.0.1 - - 
    [27/Aug/2019:16:31:38 +0000] \"POST /api/v1/actions/upload/ HTTP/1.1\" 200 1357 \"-\" \"insomnia/
    ...
    ...
    ```

- Get a list of images
  - Endpoint: `/api/image/fetch`
  - Method: `GET`
  - Query Params: `None`
  - Response: Array
    ```JSON
    [
      {
        "ID": "8f60bf1d0f34",
        "CreatedSince": "2 weeks ago",
        "Size": "470MB",
        "VirtualSize": "470MB",
        "Repository": "gsk_kubernets"
      },
      {
        "ID": "cea865d1a9a0",
        "CreatedSince": "2 weeks ago",
        "Size": "470MB",
        "VirtualSize": "470MB",
        "Repository": "docker_web"
      },
      {...},
      {...}
    ]
    ```

- Run generic command to a specific image
  - Endpoint: `/api/image/command?image=image-id&command=run`
  - Method: `GET`
  - Query Params:
    - `image`
      - Value: `image-id` ex: 3da3ad7b90e3
    - `command`
      - Value: `run`, `rmi` etc
  - Response: It might return the image id most of the time. It could be different based on the command.
    ```
    "3da3ad7b90e3"
    ```

- Get a list of container groups
  - Endpoint: `/api/groups`
  - Method: `GET`
  - Query Params: `None`
  - Response: List of groups as object.
  ```
  {
    "id": 13,
    "name": "Alien Ship Project",
    "containers_id": "[\"1bb3b55b3202\",\"171be371c488\",\"280f85e27167\"]",
    "created_at": "2019-09-18 18:01:09",
    "updated_at": "2019-09-18 18:01:09"
  },
  {...},
  {...},
  ```

- Create a container
  - Endpoint: `/api/groups`
  - Method: `POST`
  - Query Params: 
    - `name`
      - Value: 'my group name'
    - `containers`
      - Value: `['4232ewdw', 'sdsdw24343']`

- Delete a container
  - Endpoint: `/api/groups`
  - Method: `DELETE`
  - Query Params:
    - `id`
      - Value: `23`
