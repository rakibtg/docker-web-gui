const fs = require("fs");
const path = require("path");
const { safeTerminal } = require("./backend/utilities/terminal");
const port = 8080;

async function app() {
  console.clear();

  const BACKEND = path.resolve(__dirname + "/backend/");
  const NODE_MODULES = BACKEND + "/node_modules";

  if (!fs.existsSync(NODE_MODULES)) {
    console.log(
      "🚀  Please wait while we install all the dependencies for you...\n"
    );
    await safeTerminal.installModules(BACKEND);
    console.log("🎉  All dependencies added successfully!");
  }

  setTimeout(() => {
    console.log(`✨  Visit http://localhost:${port} to use Docker Web GUI`);
  }, 1500);
  await safeTerminal.serve(BACKEND);
}

app();
