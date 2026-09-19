import { defineConfig } from 'vite';

// base '/showcaserepo/' matches the GitHub project Pages URL
// https://<user>.github.io/showcaserepo/ (see README "Deploying to GitHub Pages").
export default defineConfig({
  base: '/showcaserepo/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0, // keep screenshots as separate hashed files, not data-URIs
    target: 'es2020'
  },
  server: {
    port: 5173
  },
  preview: {
    port: 4173
  }
});
