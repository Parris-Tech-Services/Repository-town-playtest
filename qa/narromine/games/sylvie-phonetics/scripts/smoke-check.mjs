#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const html = readFileSync('index.html', 'utf8')
const requiredMarkers = ['<title>', 'localStorage', 'speechSynthesis', 'Today', 'Parent', 'Review']
const missing = requiredMarkers.filter((marker) => !html.includes(marker))

if (missing.length) {
  console.error(`Smoke check failed. Missing: ${missing.join(', ')}`)
  process.exit(1)
}

const openScripts = (html.match(/<script\b/g) || []).length
const closeScripts = (html.match(/<\/script>/g) || []).length

if (openScripts !== closeScripts) {
  console.error(`Smoke check failed. Script tags are unbalanced: ${openScripts} open, ${closeScripts} close`)
  process.exit(1)
}

console.log('Static app smoke check passed')
