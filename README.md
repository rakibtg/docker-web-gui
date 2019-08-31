# Docker Web Gui Project

## Backend API

- Get a list of containers
  - Endpoint: http://localhost:3230/api/controller/fetch?status=active
  - Method: GET
  - Query Params: 
    - `status` ['all', 'active', 'stopped'] - default: 'active'
  - Response:
    An object of containers
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
  ...,
  ...
}
    ```