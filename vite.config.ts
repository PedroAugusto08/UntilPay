import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages publica o app dentro de /<repo>/, então os assets precisam desse prefixo.
  // Se o nome do repositório mudar, ajustar aqui também.
  base: '/UntilPay/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
