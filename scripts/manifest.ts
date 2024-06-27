import type { Manifest } from 'webextension-polyfill'
import { description, name, version } from '../package.json' assert { type: 'json' }

const urls = [
  'https://x.com/*',
]

export function getManifest(isFirefox: boolean): Manifest.WebExtensionManifest {
  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: isFirefox ? 2 : 3,
    name,
    version,
    description,
    icons: {
      16: './logo.png',
      48: './logo.png',
      128: './logo.png',
    },
    permissions: ['storage'],
    content_scripts: [
      {
        matches: urls,
        js: ['index.js'],
      },
    ],
  }

  if (isFirefox) {
    manifest.browser_action = {
      default_icon: './logo.png',
    }
    manifest.browser_specific_settings = {
      gecko: {
        id: 'x@savedm.com',
        strict_min_version: '48.0',
      },
    }
  }
  else {
    manifest.action = {
      default_icon: './logo.png',
    }
    manifest.content_security_policy = {
      extension_pages: 'script-src \'self\'; object-src \'self\'',
    }
  }

  return manifest
}
