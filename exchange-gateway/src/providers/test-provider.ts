import { createServer, type Server } from 'node:http'
import { createHmac, randomUUID } from 'node:crypto'
import { type AddressInfo } from 'node:net'

// ─── Test HTTP Provider ───
//
// A test-only external execution provider that runs across an HTTP boundary.
// It behaves like a real remote service: accepts execution requests, supports
// status polling, sends signed callbacks, and can simulate failures, delays,
// duplicates, out-of-order events, and invalid signatures.
//
// This provider MUST NOT move real funds or contact a production provider.

export interface TestProviderConfig {
  port?: number
  keyId: string
  secret: string
}

export interface TestProviderState {
  executions: Map<string, {
    executionId: string
    providerReference: string
    state: string
    createdAt: string
  }>
  callbacksSent: number
  server: Server | null
  baseUrl: string
}

/**
 * Create and start a test HTTP provider.
 */
export function startTestProvider(config: TestProviderConfig): Promise<TestProviderState> {
  return new Promise((resolve, reject) => {
    const state: TestProviderState = {
      executions: new Map(),
      callbacksSent: 0,
      server: null,
      baseUrl: '',
    }

    const server = createServer((req, res) => {
      // CORS headers for testing
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', '*')
      res.setHeader('Access-Control-Allow-Methods', '*')

      if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
      }

      const url = new URL(req.url ?? '/', `http://localhost:${config.port ?? 0}`)

      // POST /executions — create execution
      if (req.method === 'POST' && url.pathname === '/executions') {
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            const providerRef = `test_${randomUUID().replace(/-/g, '').slice(0, 16)}`
            state.executions.set(data.execution_id, {
              executionId: data.execution_id,
              providerReference: providerRef,
              state: 'accepted',
              createdAt: new Date().toISOString(),
            })
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
              execution_id: data.execution_id,
              provider: 'test_provider',
              provider_reference: providerRef,
              created_at: new Date().toISOString(),
            }))
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid request' }))
          }
        })
        return
      }

      // GET /executions/:id — status polling
      const statusMatch = url.pathname.match(/^\/executions\/([^/]+)$/)
      if (req.method === 'GET' && statusMatch) {
        const exec = state.executions.get(statusMatch[1])
        if (exec) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            execution_id: exec.executionId,
            state: exec.state,
            updated_at: new Date().toISOString(),
          }))
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Execution not found' }))
        }
        return
      }

      // POST /executions/:id/callback — manually trigger a callback
      const callbackMatch = url.pathname.match(/^\/executions\/([^/]+)\/callback$/)
      if (req.method === 'POST' && callbackMatch) {
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            const exec = state.executions.get(callbackMatch[1])
            if (!exec) {
              res.writeHead(404, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Execution not found' }))
              return
            }

            // Update internal state
            if (data.status) exec.state = data.status

            // Build the callback payload
            const callbackPayload = data.payload || {
              receipt: {
                execution_reference: {
                  execution_id: exec.executionId,
                  provider: 'test_provider',
                  provider_reference: exec.providerReference,
                  created_at: exec.createdAt,
                },
                provider: 'test_provider',
                provider_reference: exec.providerReference,
                status: data.status || 'delivered',
                executor: { id: 'test-worker', role: 'external' },
                timestamps: {
                  created: exec.createdAt,
                  delivered: new Date().toISOString(),
                },
              },
              provider_event_id: data.provider_event_id || `evt_${randomUUID()}`,
              provider_event_timestamp: new Date().toISOString(),
            }

            const callbackUrl = data.callback_url
            if (callbackUrl) {
              sendSignedCallback(callbackUrl, callbackPayload, config.keyId, config.secret, data.provider_event_id || callbackPayload.provider_event_id)
                .then((result) => {
                  state.callbacksSent++
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ sent: true, response_status: result.status, ...result }))
                })
                .catch((err) => {
                  res.writeHead(500, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ error: err.message }))
                })
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ payload: callbackPayload, signature_info: { key_id: config.keyId } }))
            }
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid request' }))
          }
        })
        return
      }

      // POST /executions/:id/fail — simulate provider failure
      const failMatch = url.pathname.match(/^\/executions\/([^/]+)\/fail$/)
      if (req.method === 'POST' && failMatch) {
        const exec = state.executions.get(failMatch[1])
        if (exec) exec.state = 'failed'
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ failed: true }))
        return
      }

      // POST /executions/:id/cancel — simulate cancellation
      const cancelMatch = url.pathname.match(/^\/executions\/([^/]+)\/cancel$/)
      if (req.method === 'POST' && cancelMatch) {
        const exec = state.executions.get(cancelMatch[1])
        if (exec) exec.state = 'cancelled'
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ cancelled: true }))
        return
      }

      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    })

    server.listen(config.port ?? 0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo
      state.server = server
      state.baseUrl = `http://127.0.0.1:${addr.port}`
      resolve(state)
    })

    server.on('error', reject)
  })
}

/**
 * Stop the test provider.
 */
export function stopTestProvider(state: TestProviderState): Promise<void> {
  return new Promise((resolve) => {
    if (state.server) {
      state.server.close(() => resolve())
    } else {
      resolve()
    }
  })
}

/**
 * Send a signed callback to the receipt endpoint.
 *
 * The signature format is:
 *   t=<unix_ms>,v1=<hex_sig>,key_id=<keyId>
 *
 * The signed material is:
 *   provider_event_id.timestamp.rawBody
 */
export async function sendSignedCallback(
  url: string,
  payload: unknown,
  keyId: string,
  secret: string,
  providerEventId: string,
  options?: {
    alterBody?: boolean
    invalidSignature?: boolean
    unknownKeyId?: boolean
    expiredTimestamp?: boolean
    noEventIdHeader?: boolean
  },
): Promise<{ status: number; body: unknown }> {
  let bodyStr = JSON.stringify(payload)

  // Optionally alter the body (for testing invalid signatures)
  if (options?.alterBody) {
    bodyStr = bodyStr + 'tampered'
  }

  const timestamp = options?.expiredTimestamp
    ? String(Date.now() - 10 * 60 * 1000) // 10 minutes ago
    : String(Date.now())

  const signedMaterial = `${providerEventId}.${timestamp}.${bodyStr}`
  const sig = createHmac('sha256', secret).update(signedMaterial).digest('hex')

  const sigHeader = options?.invalidSignature
    ? `t=${timestamp},v1=0000000000000000000000000000000000000000000000000000000000000000,key_id=${keyId}`
    : `t=${timestamp},v1=${sig},key_id=${options?.unknownKeyId ? 'unknown_key' : keyId}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-provider-signature': sigHeader,
  }
  if (!options?.noEventIdHeader) {
    headers['x-provider-event-id'] = providerEventId
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: bodyStr,
  })

  let responseBody: unknown
  try {
    responseBody = await response.json()
  } catch {
    responseBody = await response.text()
  }

  return { status: response.status, body: responseBody }
}

/**
 * Register the test provider with the execution router.
 */
export function createTestProviderAdapter(baseUrl: string, keyId: string, secret: string) {
  return {
    id: 'test_provider',
    capabilities() {
      return {
        task_execution: true,
        worker_discovery: true,
        escrow: false,
        collateral: false,
        verification: true,
        arbitration: false,
        agent_messaging: true,
        programmable_splits: false,
        fiat_settlement: false,
        crypto_settlement: false,
      }
    },
    async canExecute() {
      return { can_execute: true, reasons: ['test provider accepts all work'] }
    },
    async createExecution(request: any) {
      const response = await fetch(`${baseUrl}/executions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      if (!response.ok) throw new Error(`Test provider createExecution failed: ${response.status}`)
      const data = await response.json()
      return {
        execution_id: data.execution_id,
        provider: 'test_provider',
        provider_reference: data.provider_reference,
        created_at: data.created_at,
      }
    },
    async getExecution(reference: any) {
      const response = await fetch(`${baseUrl}/executions/${reference.execution_id}`)
      if (!response.ok) throw new Error(`Test provider getExecution failed: ${response.status}`)
      const data = await response.json()
      return {
        reference,
        state: data.state,
        updated_at: data.updated_at,
        provider_state: data.state,
      }
    },
    async cancelExecution(reference: any) {
      await fetch(`${baseUrl}/executions/${reference.execution_id}/cancel`, { method: 'POST' })
    },
  }
}
