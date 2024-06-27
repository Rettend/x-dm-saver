import fs from 'node:fs'
import { defineBuildConfig } from 'unbuild'
import { r } from './scripts/utils'

export default defineBuildConfig({
  hooks: {
    'build:done': () => {
      fs.renameSync(r('dist/index.mjs'), r('dist/index.js'))
    },
  },
  entries: [
    'index.ts',
    { input: 'extension/' },
  ],
})
