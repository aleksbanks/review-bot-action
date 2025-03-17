"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
async function run() {
    try {
        // Get GitHub token from input
        const token = core.getInput("githubToken");
        const octokit = (0, github_1.getOctokit)(token);
        // Get the PR details from GitHub context
        const { owner, repo } = github_1.context.repo;
        const prNumber = github_1.context.payload.pull_request?.number;
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
        let config = {};
        try {
            const configFile = fs_1.default.readFileSync(".reviewbot.json", "utf-8");
            config = JSON.parse(configFile);
        }
        catch (error) {
            core.info("No .reviewbot.json found, using defaults");
            config = {}; // Load default config if no file found
        }
        // Check the PR branch name (example check)
        if (config.branchRules && config.branchRules.length > 0) {
            const branchCheck = config.branchRules.find((rule) => new RegExp(rule.pattern).test(pr.data.head.ref));
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
            (0, child_process_1.execSync)("npx eslint . --format json", { stdio: "pipe" });
        }
        catch (eslintError) {
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
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();
