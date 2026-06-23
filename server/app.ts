import cors from 'cors'
import express from 'express'
import { api } from './routes.ts'
import { ensureSeeded } from './db.ts'

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use('/api', api)
  return app
}

export const app = createApp()

export async function boot() {
  await ensureSeeded()
}
