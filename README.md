# A simple GUI interface for Docker Containers

<p align="center">
  <img src="https://i.imgur.com/z95AFEC.png" alt="Docker Web Interface Project - A simple GUI interface for Docker" title="Docker Web Interface Project - A simple GUI interface for Docker">
</p>

| <p align="center"><img src="https://i.imgur.com/J2NIzEN.png"/><br/>Createing a group of container</p> | <p align="center"><img src="https://i.imgur.com/ug2hHo2.png"/><br/>List of containers</p> |
|------|--------------|
| <p align="center"><img src="https://i.imgur.com/HuUNz6h.png"/><br/>List of images</p> | <p align="center"><img src="https://i.imgur.com/s3CHjcQ.png"/><br/>Disk cleanup's</p> |


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

# Documentations
- [Backend API](https://github.com/rakibtg/docker-web-gui/tree/master/backend)
- [Client](https://github.com/rakibtg/docker-web-gui/tree/master/client)

Developed by [Mehedi](https://twitter.com/rakibtg) and Akimul.