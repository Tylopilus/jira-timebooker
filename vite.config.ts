/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';
import zipPack from 'vite-plugin-zip-pack';
import path from 'path';
import manifest from './src/manifest';
//@ts-ignore
import { config } from './src/read_pages_folder';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
   return {
      build: {
         emptyOutDir: true,
         outDir: 'build',
         minify: false,
         rollupOptions: {
            input: config,
            output: {
               chunkFileNames: 'assets/chunk-[hash].js',
            },
         },
      },
      test: {
         globals: true,
         environment: 'jsdom',
         setupFiles: './src/test/setup.ts',
         //    browser: {
         //       headless: false,
         //       name: 'chrome',
         //       enabled: true,
         // },
      },

      plugins: [
         crx({ manifest }),
         react(),
         eslint(),
         zipPack({
            outDir: `package`,
            inDir: 'build',
            // @ts-expect-error needed here
            outFileName: `${manifest.short_name ?? manifest.name.replaceAll(' ', '-')}-extension-v${
               // @ts-expect-error needed here
               manifest.version
            }.zip`,
         }),
      ],
      resolve: {
         alias: {
            '@': path.resolve(__dirname, './src'),
         },
      },
   };
});
