import type { VercelRequest, VercelResponse } from '@vercel/node'
import { app, boot } from '../server/app.ts'

let ready = false

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!ready) {
    await boot()
    ready = true
  }
  return app(req, res)
}
