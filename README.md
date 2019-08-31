# Docker Web Gui Project

## Backend API

- Get a list of containers
  - Endpoint: `/api/controller/fetch?status=active`
  - Method: `GET`
  - Query Params: 
    - `status` 
      - Value: `all`, `active`, `stopped` 
      - default: `active`
  - Response: An object of containers
    ```JSON
    {
      "19ea7e796993": {
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
      {...},
    }
    ```

- Get a container by ID
  - Endpoint: `/api/controller/fetchById?container=container-id`
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
  - Endpoint: `/api/controller/command?container=container-id&command=start`
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
