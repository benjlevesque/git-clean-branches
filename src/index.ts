import { exec } from "child_process";
import { promisify } from "util";
import inquirer from "inquirer";
import ora from "ora";

const execAsync = promisify(exec);

const gitExec = async (command: string) => {
  const { stdout } = await execAsync(command, {
    cwd: process.cwd(),
  });
  const result = stdout.split("\n").filter((s) => !!s);
  return result;
};

const wrapSpinner = async (text, callback) => {
  const spinner = ora(`${text}...`).start();
  await callback();
  spinner.stopAndPersist({
    symbol: "✔",
  });
};

const pruneRemotes = async () => {
  await wrapSpinner("Delete remote branches...", () =>
    execAsync(`git remote prune origin`)
  );
};

const promptRemapOrigin = async () => {
  const remoteBranches = await gitExec(
    `git for-each-ref --format='%(refname)' refs/remotes/origin | cut -c 21-`
  );

  const localBranchesWithNoRemote = await gitExec(
    `git branch -vv | grep 'origin/.*' -v | awk '{print $1}'`
  );

  const branches = localBranchesWithNoRemote.filter((x) =>
    remoteBranches.includes(x)
  );

  if (branches.length === 0) {
    return;
  }

  const { branchesToUpdate } = await inquirer.prompt<{
    branchesToUpdate: string[];
  }>({
    message: "Which branches do you want to remap",
    name: "branchesToUpdate",
    type: "checkbox",
    choices: branches.map((branch) => ({
      checked: true,
      value: branch,
      name: `${branch} => origin/${branch}`,
    })),
  });

  for (const branch of branchesToUpdate) {
    await wrapSpinner(`Update origin for ${branch}...`, () =>
      execAsync(`git branch --set-upstream-to=origin/${branch} ${branch}`)
    );
  }
};

const promptRemoveNoOrigin = async () => {
  const { stdout } = await execAsync(
    `git branch -vv | grep 'origin/.*: gone]' | awk '{print $1}'`,
    {
      cwd: process.cwd(),
    }
  );
  const branches = stdout.split("\n").filter((s) => !!s);
  if (branches.length === 0) {
    return;
  }
  const { branchesToDelete } = await inquirer.prompt<{
    branchesToDelete: string[];
  }>({
    message: "Which branches do you want to clean?",
    name: "branchesToDelete",
    type: "checkbox",
    choices: branches.map((branch) => ({
      checked: true,
      name: branch,
    })),
  });
  for (const branch of branchesToDelete) {
    await wrapSpinner(`Clear ${branch}...`, () =>
      execAsync(`git branch -D ${branch}`)
    );
  }
};

const main = async () => {
  await promptRemapOrigin();
  await pruneRemotes();
  await promptRemoveNoOrigin();
};

main();
