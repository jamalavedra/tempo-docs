import react from '@vitejs/plugin-react'
import { Instance } from 'prool'
import { defineConfig, type Plugin } from 'vite'
import { vocs } from 'vocs/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vocs(), react(), tempoNode(), patchIconifyImports()],
})

function patchIconifyImports(): Plugin {
  return {
    name: 'patch-iconify-imports',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('icons') || !code.includes('@vite-ignore')) return

      return code.replace(
        /await import\(\s*\/\*\s*@vite-ignore\s*\*\/\s*`@iconify-json\/\$\{collection\}`\s*\)/g,
        `(collection === 'lucide' ? await import('@iconify-json/lucide') : collection === 'simple-icons' ? await import('@iconify-json/simple-icons') : await Promise.reject(new Error('Unknown collection')))`,
      )
    },
  }
}

function tempoNode(): Plugin {
  return {
    name: 'tempo-node',
    async configureServer(_server) {
      if (!('VITE_TEMPO_ENV' in process.env) || process.env.VITE_TEMPO_ENV !== 'localnet') return
      const instance = Instance.tempo({
        dev: { blockTime: '500ms' },
        port: 8545,
      })
      console.log('→ starting tempo node...')
      await instance.start()
      console.log('√ tempo node started on port 8545')
    },
  }
}
