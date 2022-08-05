import { CommanderStatic } from "commander";

export default (program: CommanderStatic) => {
  return program
    .command("countdown <count>")
    .alias("cd")
    .description("Countdown timer")
    .option("-i, --interval <interval>", "The delay between ticks", 1000)
    .action(function(count, command) {
      console.log(count);
    });
};
