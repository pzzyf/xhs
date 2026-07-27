import { serve } from '@hono/node-server'
import { createServer } from 'node:net'

import { app } from './app'

const defaultPort = Number(process.env.PORT ?? 3000)

async function isPortAvailable(port: number) {
  return new Promise<boolean>((resolve) => {
    const server = createServer()

    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })

    server.listen(port)
  })
}

async function getPort(port: number) {
  if (process.env.PORT) {
    return port
  }

  let nextPort = port
  while (!(await isPortAvailable(nextPort))) {
    nextPort += 1
  }

  return nextPort
}

const port = await getPort(defaultPort)

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Hono server listening on http://localhost:${info.port}`)
  },
)
