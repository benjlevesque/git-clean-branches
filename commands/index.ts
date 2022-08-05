import { CommanderStatic } from "commander";

const fs = require("fs");
const path = require("path");

export default (program: CommanderStatic) => {
  const commands = {};
  const loadPath = path.dirname(__filename);

  // Loop though command files
  fs.readdirSync(loadPath)
    .filter(filename => /\.ts$/.test(filename) && filename !== "index.ts")
    .forEach(filename => {
      const name = filename.substr(0, filename.lastIndexOf("."));
      // Require command
      const command = require(path.join(loadPath, filename)).default;
      // Initialize command
      commands[name] = command(program);
    });

  return commands;
};
