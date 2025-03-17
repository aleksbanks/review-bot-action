import * as core from "@actions/core";
import { context, getOctokit } from "@actions/github";
import fs from "fs";
import { execSync } from "child_process";

interface BranchRule {
  pattern: string;
  allowMerge: boolean;
}

interface Config {
  branchRules?: BranchRule[];
  commitMessageRules?: {
    mustInclude: string;
    minLength: number;
  };
  prTitleRules?: {
    mustStartWith: string;
    minLength: number;
  };
  restrictedFiles?: string[];
}

async function run() {
  try {
    // Get GitHub token from input
    const token = core.getInput("githubToken");
    const octokit = getOctokit(token);

    // Get the PR details from GitHub context
    const { owner, repo } = context.repo;
    const prNumber = context.payload.pull_request?.number;

    if (!prNumber) {
      throw new Error("No PR number found in the context.");
    }

    // Fetch PR data
    const pr = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    // Check if .reviewbot.json exists
    let config: Config = {};
    try {
      const configFile = fs.readFileSync(".reviewbot.json", "utf-8");
      config = JSON.parse(configFile);
    } catch (error) {
      core.info("No .reviewbot.json found, using defaults");
      config = {}; // Load default config if no file found
    }

    // Check the PR branch name (example check)
    if (config.branchRules && config.branchRules.length > 0) {
      const branchCheck = config.branchRules.find((rule) =>
        new RegExp(rule.pattern).test(pr.data.head.ref)
      );
      if (branchCheck && !branchCheck.allowMerge) {
        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body: `🚨 Branch naming rule violated: '${pr.data.head.ref}' doesn't allow merging.`,
        });
        return;
      }
    }

    // Run ESLint checks on the PR code (if repo has ESLint)
    try {
      execSync("npx eslint . --format json", { stdio: "pipe" });
    } catch (eslintError: any) {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `🚨 ESLint issues detected:\n\`\`\`\n${eslintError.message}\n\`\`\``,
      });
      return;
    }

    // Success message (if no issues found)
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `✅ PR passed all checks!`,
    });
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
