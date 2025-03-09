const fs = require("fs");

/**
 * Writes content to a file.
 * @param {string} filePath - The file path where the content will be written.
 * @param {string} content - The content to write to the file.
 * @returns {Promise<void>} - Resolves when writing is complete.
 */

function write(filePath, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, "utf8", (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

module.exports = write;
