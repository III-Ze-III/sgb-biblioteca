import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = process.env.API_TARGET || env.API_TARGET || 'http://127.0.0.1:5000';
  const proxy = { '/api': { target, changeOrigin: true, rewrite: path => path.replace(/^\/api(?=\/|$)/, '') || '/' } };
  return { server: { proxy }, preview: { proxy } };
});