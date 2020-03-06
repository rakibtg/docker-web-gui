# Docker Dashboard
## A simple GUI interface for Docker Containers

<p align="center">
  <img src="https://i.imgur.com/z95AFEC.png" alt="Docker Web Interface Project - A simple GUI interface for Docker" title="Docker Web Interface Project - A simple GUI interface for Docker">
</p>

|<p align="center"><img src="https://i.imgur.com/pgXpRJR.png"/><br/>Explore containers log</p> | <p align="center"><img src="https://i.imgur.com/ug2hHo2.png"/><br/>List of groups</p> |
|--|--|

| <p align="center"><img src="https://i.imgur.com/ug2hHo2.png"/><br/>List of groups</p> |<p align="center"><img src="https://i.imgur.com/HuUNz6h.png"/><br/>List of images</p> | <p align="center"><img src="https://i.imgur.com/s3CHjcQ.png"/><br/>Disk cleanup's</p> |
|--|--|--|


## Features
- Instantly start/stop, restart, delete and see the logs of a docker container.
- Filter containers by their running status.
- Create groups of docker container.
- Bulk action on container based on group.
- Live system consumption stat for active docker containers.
- Run or delete an image.
- Prune Docker images.
- Prune Docker containers.
- Prune Docker volumes.
- Prune Docker systems.
- No need to use the terminal for common tasks.

## Start the app
Before you follow below steps to start the app, make sure you have `node` and `npm` installed in your system.
- Clone the repository
  ```
  git clone git@github.com:rakibtg/docker-web-gui.git
  ```
- Change directory
  ```
  cd ./docker-web-gui
  ````
- Run `app.js`, it will automatically install all the [node modules](https://github.com/rakibtg/docker-web-gui/blob/master/backend/package.json) for you if not installed already.
  ```
  node app.js
  ```
- Now visit http://localhost:3230/

## Using Docker

You can run this application through a docker container, but it only works in **MacOS**. You can use that with/without [**`docker compose`**](https://docs.docker.com/compose/).
Also, the application will be exposed at port http://localhost:3230.

### Without Docker Compose

If you don't have a docker compose, then you can use the following commands:

- To build the image:
    ```
    docker build . -t docker-web-gui
    ```
- To run the image:
    ```
    docker run -p 3230:3230 -v /usr/local/bin/docker:/usr/local/bin/docker -v /var/run/docker.sock:/var/run/docker.sock docker-web-gui
    ```

### With Docker Compose

If you already docker compose installed, then simply do this:

```
docker-compose build
docker-compose up
```

### Docker Based Commands

A `Makefile` has been included with this repo. It has following commands:

1. `make up` to build the image and starting `docker-web-gui` container.
2. `make build` to build the image.
3. `make start` to start containers if application has been up already.
4. `make stop` to stop application.
5. `make restart` to restart application.
6. `make build-without-compose` to build the application without *docker compose*.
7. `make run-without-compose` to run the application without *docker compose*.

# Documentations
- [Backend API](https://github.com/rakibtg/docker-web-gui/tree/master/backend)
- [Client](https://github.com/rakibtg/docker-web-gui/tree/master/client)

Developed by [Mehedi](https://twitter.com/rakibtg) and [Akimul](https://www.linkedin.com/in/akimulakash/).
