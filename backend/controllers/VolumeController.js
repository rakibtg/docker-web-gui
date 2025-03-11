const { safeTerminal } = require("../utilities/terminal");

exports.fetch = async (req, res) => {
  try {
    const rawVolumes = await safeTerminal.listVolumes();
    const volumes = rawVolumes
      .split("\n")
      .filter((volume) => volume !== "")
      .map((volume) => JSON.parse(volume));
    res.json(volumes);
  } catch (error) {
    console.error("Error fetching volumes:", error);
    res.status(500).json({ error: "Failed to fetch volumes" });
  }
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await safeTerminal.createVolume(name);
    res.json(result);
  } catch (error) {
    console.error("Error creating volume:", error);
    res.status(500).json({ error: "Failed to create volume" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { name } = req.params;
    const result = await safeTerminal.removeVolume(name);
    res.json(result);
  } catch (error) {
    console.error("Error removing volume:", error);
    res.status(500).json({ error: "Failed to remove volume" });
  }
};
