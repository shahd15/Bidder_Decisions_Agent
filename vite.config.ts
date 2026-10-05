import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Resolve and sanitize Supabase credentials from process.env
const candidatesUrl = [
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.VITE_SUPABASE_URL,
];
const candidatesKey = [
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  process.env.VITE_SUPABASE_ANON_KEY,
  process.env.VITE_SUPABASE_URL, // In case VITE_SUPABASE_URL was set to the key
];

let cleanUrl =
  candidatesUrl.find(
    (u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://'))
  ) || '';
if (cleanUrl) {
  cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

let cleanKey =
  candidatesKey.find(
    (k) =>
      typeof k === 'string' &&
      k.length > 10 &&
      !k.startsWith('http://') &&
      !k.startsWith('https://')
  ) || '';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(cleanUrl),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(cleanKey),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(cleanUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(cleanKey),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
