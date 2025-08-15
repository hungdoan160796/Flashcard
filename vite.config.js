import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // If your repo is https://github.com/<user>/<repo-name>
  base: '/',        // <-- set this
  // If your repo is <user>.github.io (root domain), use: base: '/'
})
