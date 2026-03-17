import type { Config } from 'telefunc';

const telefuncConfig: Config = {
  root: process.cwd(),
  baseDir: 'src/',
  telefuncFilesGlob: '**/*.telefunc.{ts,js}',
  telefuncUrl: '/api/telefunc',
  outDir: '.telefunc',
  transformImports: {
    addExtension: '.js'
  }
};

export { telefuncConfig as default };
