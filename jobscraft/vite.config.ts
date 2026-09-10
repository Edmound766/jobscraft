import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tailwindcss from '@tailwindcss/vite'

import { tanstackStart } from '@tanstack/solid-start/plugin/vite'

import solidPlugin from 'vite-plugin-solid'
import { nitro } from 'nitro/vite'
import path from "node:path"

export default defineConfig({
  resolve: { tsconfigPaths: true,
  alias:{
      "~":path.resolve(__dirname,"./src/")
    }},
  plugins: [
    devtools(),
    nitro(),
    tailwindcss(),
    tanstackStart(),
    solidPlugin({ ssr: true }),
  ],
})
