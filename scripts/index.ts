import process from 'node:process'
import { log, r } from './utils'
import { getManifest } from './manifest'

log('PRE', 'write manifest.json')
const isFirefox = process.env.FIREFOX === 'true'
const manifest = `${JSON.stringify(getManifest(isFirefox), null, 2)}\n`
Bun.write(r('extension/manifest.json'), manifest)
