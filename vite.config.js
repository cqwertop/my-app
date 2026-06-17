import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export const appPalette = {
  'cool-sky': '#35a7ff',
  'baltic-blue': '#38618C',
  'Alice-Blue': '#f3faff',
  'Lavender-Gray': '#949ebd',
  'Prussian-Blue': '#00062A',
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
