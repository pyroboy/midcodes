import { defineConfig, type Plugin } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

function stubNodeBuiltinsForCloudflare(): Plugin {
	const stubs: Record<string, string> = {
		'node:fs': `export default {};export const readFileSync=()=>null;export const writeFileSync=()=>{};export const existsSync=()=>false;export const mkdirSync=()=>{};export const readdirSync=()=>[];export const statSync=()=>({isDirectory:()=>false,isFile:()=>false});export const unlinkSync=()=>{};export const createReadStream=()=>({pipe:()=>{},on:()=>{}});export const createWriteStream=()=>({write:()=>{},end:()=>{},on:()=>{}});`,
		'node:fs/promises': `export default {};export const readFile=async()=>null;export const writeFile=async()=>{};export const mkdir=async()=>{};export const readdir=async()=>[];export const stat=async()=>({isDirectory:()=>false,isFile:()=>false});export const unlink=async()=>{};export const access=async()=>{throw new Error('ENOENT')};`,
		'node:os': `export default{tmpdir:()=>'/tmp',homedir:()=>'/tmp',platform:()=>'linux',type:()=>'Linux',hostname:()=>'cloudflare',cpus:()=>[],freemem:()=>0,totalmem:()=>0};export const tmpdir=()=>'/tmp';export const homedir=()=>'/tmp';export const platform=()=>'linux';`
	};
	return {
		name: 'stub-node-builtins-for-cloudflare',
		enforce: 'pre',
		resolveId(id: string) { if (id in stubs) return `\0cf-stub:${id}`; },
		load(id: string) { if (id.startsWith('\0cf-stub:')) { return stubs[id.replace('\0cf-stub:', '')] ?? 'export default {}'; } }
	};
}

export default defineConfig({
	plugins: [sveltekit(), tailwindcss(), stubNodeBuiltinsForCloudflare()],
	define: { global: 'globalThis' },
	server: { host: true, port: 5176 }
});
