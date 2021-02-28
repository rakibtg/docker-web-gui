const { safeTerminal } = require("../utilities/terminal");
const { lightContainerDetail } = require("../utilities/lightContainerDetail");

exports.fetch = async (req, res) => {
  const status = req.query.status ? req.query.status : "active";
  const rawContainersFromCmd = await safeTerminal.allContainers();
  const containers = rawContainersFromCmd
    .split("\n")
    .map((container) => container.trim())
    .filter((container) => container !== "");
  let results = [];
  await Promise.all(
    containers.map(async (container) => {
      const inspectedContainer = await safeTerminal.inspectContainer(container);
      const tintContainer = JSON.parse(inspectedContainer)[0];
      if (status === "active") {
        if (tintContainer.State.Running === true)
          results.push(lightContainerDetail(container, tintContainer));
      } else if (status === "all") {
        results.push(lightContainerDetail(container, tintContainer));
      } else if (status === "stopped") {
        if (tintContainer.State.Running !== true)
          results.push(lightContainerDetail(container, tintContainer));
      }
    })
  );
  res.json(results.sort((a, b) => (a.Name > b.Name ? 1 : -1)));
};

exports.fetchById = async (req, res) => {
  const containerID = req.query.container;
  const containerInspect = await safeTerminal.inspectContainer(containerID);
  const container = lightContainerDetail(
    containerID,
    JSON.parse(containerInspect)[0]
  );
  res.json(container);
};

exports.command = async (req, res, next) => {
  const containerID = req.query.container;
  const command = req.query.command;
  try {
    const cmdData = await safeTerminal.generic(command, containerID);
    res.json(cmdData.replace("\n", ""));
  } catch (error) {
    next(error);
  }
};

exports.logs = async (req, res) => {
  const containerID = req.query.container;
  const data = await safeTerminal.logs(containerID);
  res.json(data);
};

exports.stats = async (req, res) => {
  const cmdStats = await safeTerminal.stats();
  const statsArray = cmdStats
    .split("\n")
    .filter((container) => container !== "")
    .map((stat) => JSON.parse(stat));
  res.json(statsArray);
};
