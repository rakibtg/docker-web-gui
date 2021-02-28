const child_process = require("child_process");

const isValidId = (id) => /^[0-9a-zA-Z]+$/.test(id.trim());
const isValidString = (id) => /^[a-zA-Z]+$/.test(id.trim());

const Terminal = (command) =>
  new Promise((resolve, reject) => {
    child_process.exec(
      command,
      { maxBuffer: 1500 * 1024 },
      function (error, stdout, stderr) {
        if (!!error) reject(error);
        else resolve(stdout || stderr);
      }
    );
  });

exports.safeTerminal = {
  installModules: async (backendPath) => {
    await Terminal(`cd ${backendPath} && npm install`);
  },
  serve: async (backendPath) => {
    await Terminal(`cd ${backendPath} && node index.js`);
  },
  allContainers: () => Terminal(`docker ps -q -a`),
  inspectContainer: async (id) => {
    if (isValidId(id)) {
      return Terminal(`docker container inspect ${id}`);
    } else {
      throw new Error("The container id is invalid");
    }
  },
  generic: async (task, id) => {
    if (!isValidString(task)) {
      throw new Error("The task command is invalid.");
    }
    if (!isValidId(id)) {
      throw new Error("The container id is invalid");
    }
    return Terminal(`docker container ${task} ${id}`);
  },
  logs: async (id) => {
    if (!isValidId(id)) {
      throw new Error("The container id is invalid");
    }
    return Terminal(`docker container logs ${id} --tail 1500`);
  },
  stats: () =>
    Terminal(
      `docker container stats --no-stream --format '{"id": "{{.ID}}", "cpu_percentage": "{{.CPUPerc}}", "memory_usage": "{{.MemUsage}}", "network_io": "{{.NetIO}}"}'`
    ),
  prune: (pruneType) => {
    if (!isValidString(pruneType)) {
      throw new Error("The entity type is not valid");
    }
    return Terminal(`docker ${pruneType} prune -f`);
  },
  containerLs: () => Terminal(`docker container ls --format '{{json .}}'`),
  formattedImages: () =>
    Terminal(
      `docker images --format '{"ID": "{{.ID}}", "Tag": "{{.Tag}}", "CreatedSince": "{{.CreatedSince}}", "Size": "{{.Size}}", "VirtualSize": "{{.VirtualSize}}", "Repository": "{{.Repository}}"}'`
    ),
  singleImage: (task, id) => {
    if (!isValidString(task)) {
      throw new Error("The task command is invalid.");
    }
    if (!isValidId(id)) {
      throw new Error("The image id is invalid");
    }
    if (task == "run") {
      return Terminal(`docker ${task} ${id}`);
    } else {
      return Terminal(`docker image ${task} ${id}`);
    }
  },
};
