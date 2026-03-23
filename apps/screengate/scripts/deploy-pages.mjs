#!/usr/bin/env node
import { spawn } from 'node:child_process';

function run(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true, env: process.env });
    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', () => resolve(1));
  });
}

const projectName = 'screengate';
const outputDir = '.svelte-kit/cloudflare';

await run('npx', ['wrangler', 'pages', 'project', 'create', projectName, '--production-branch', 'main']);
const deployExit = await run('npx', ['wrangler', 'pages', 'deploy', outputDir, '--project-name', projectName]);
process.exit(deployExit);
