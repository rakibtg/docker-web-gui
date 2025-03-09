const fs = require("fs");

/**
 * Checks if a file exists.
 * @param {string} filePath - The path to the file.
 * @returns {Promise<boolean>} - Resolves true if the file exists, false otherwise.
 */

function fileExists(filePath) {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      resolve(!err);
    });
  });
}

module.exports = fileExists;
