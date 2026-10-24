// Copies the Three.js assets (moss textures, font, three.min.js) that ship inside
// @designcodeio/threeui into /public/landing-pages, next to origano-hero.html.
import { cpSync, existsSync, mkdirSync } from 'node:fs'

const from = 'node_modules/@designcodeio/threeui/lib-dist/assets/landing-pages/inner-green-assets'
const to = 'public/landing-pages/inner-green-assets'
if (!existsSync(from)) {
  console.warn('[copy-sylva] @designcodeio/threeui not installed yet, skipping.')
} else {
  mkdirSync(to, { recursive: true })
  cpSync(from, to, { recursive: true })
  console.log('[copy-sylva] hero assets copied to public/landing-pages/inner-green-assets')
}
