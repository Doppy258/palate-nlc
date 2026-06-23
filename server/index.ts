import 'dotenv/config'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, boot } from './app.ts'

const PORT = Number(process.env.PORT) || 3001
const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, '..', 'dist')

if (existsSync(distPath)) {
  const express = await import('express')
  app.use(express.default.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

await boot()

app.listen(PORT, () => {
  console.log(`Palate API running at http://localhost:${PORT}`)
  if (existsSync(distPath)) console.log(`Serving frontend from ${distPath}`)
})
