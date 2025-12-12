#!/usr/bin/env node
/**
 * Cloudflare Pages deploy helper.
 *
 * Why: "wrangler pages deploy" fails with "Project not found" if the Pages project
 * hasn't been created yet, or if CI is using a different project name.
 *
 * This script:
 * 1) Resolves the project name from env vars or wrangler.jsonc.
 * 2) Tries to create the Pages project (no-op if it already exists).
 * 3) Deploys the build output.
 */

import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

function run(cmd, args, { inheritEnv = true } = {}) {
    return new Promise((resolve) => {
        const child = spawn(cmd, args, {
            stdio: 'inherit',
            shell: process.platform === 'win32',
            env: inheritEnv ? process.env : {},
        });

        child.on('close', (code) => resolve(code ?? 1));
        child.on('error', () => resolve(1));
    });
}

function stripJsonc(jsoncText) {
    // Remove // line comments and /* */ block comments (good enough for wrangler.jsonc)
    return jsoncText
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
}

async function resolveProjectName() {
    const fromEnv =
        process.env.CF_PAGES_PROJECT_NAME ??
        process.env.CLOUDFLARE_PAGES_PROJECT ??
        process.env.PAGES_PROJECT_NAME ??
        process.env.WRANGLER_PAGES_PROJECT_NAME;
    if (fromEnv && fromEnv.trim()) return fromEnv.trim();

    try {
        // Prefer plain JSON first (Cloudflare Pages build expects `wrangler.json`).
        const json = await readFile(new URL('../wrangler.json', import.meta.url), 'utf8');
        const parsed = JSON.parse(json);
        if (typeof parsed?.name === 'string' && parsed.name.trim()) return parsed.name.trim();
    } catch {
        // ignore
    }

    try {
        const jsonc = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
        const parsed = JSON.parse(stripJsonc(jsonc));
        if (typeof parsed?.name === 'string' && parsed.name.trim()) return parsed.name.trim();
    } catch {
        // ignore
    }

    return 'midcodes';
}

const outputDir = process.env.CF_PAGES_OUTPUT_DIR?.trim() || '.svelte-kit/cloudflare';
const productionBranch = process.env.CF_PAGES_PRODUCTION_BRANCH?.trim() || 'main';
const projectName = await resolveProjectName();

// Ensure the output dir exists (wrangler will error with a clearer message than we can provide).
// Create the project if it doesn't exist yet.
// This is safe to run on every deploy; if it already exists, wrangler exits non-zero and we continue.
await run('npx', ['wrangler', 'pages', 'project', 'create', projectName, '--production-branch', productionBranch]);

const deployExit = await run('npx', [
    'wrangler',
    'pages',
    'deploy',
    outputDir,
    '--project-name',
    projectName,
]);

process.exit(deployExit);
