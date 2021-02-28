const { safeTerminal } = require("../utilities/terminal");

exports.command = async (req, res, next) => {
  const pruneType = req.query.type;
  try {
    const cmdData = await safeTerminal.prune(pruneType);
    res.json(cmdData);
  } catch (error) {
    next(error);
  }
};
