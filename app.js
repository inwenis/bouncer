const express = require('express')
const logger = require('pino')()
const axios = require('axios')
const { AxiosError } = require('axios')
const humanizeDuration = require('humanize-duration')

const PORT              = process.env.PORT              || 3000
const NEXT_NODE         = process.env.NEXT_NODE         || 'http://localhost:3000'
const AUTO_START_BOUNCE = process.env.AUTO_START_BOUNCE || false
const INITIAL_PACKAGE = {
    start: Date.now(),
    bounceCount: 0,
    number: 42
}

const index = `
<!DOCTYPE html>
<html>
    <body>
        <h1>Bouncer</h1>
        <pre id="output"></pre>
        <script>
            const eventSource = new EventSource('/stream')
            eventSource.onmessage = function(event) {
                document.getElementById('output').textContent = event.data + "\\n"
            }
        </script>
    </body>
</html>`

let currentPackage = null

function randomizeNewNumber() {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
}

async function bouncePackage(dest, pacakge) {
    try {
        await axios({
            method: 'post',
            url: `${dest}/bounce`,
            data: pacakge,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        if (error instanceof AxiosError) {
            logger.error({ url: error.config.url }, `Error bouncing package: ${error.message}`)
        } else {
            logger.error(`Error bouncing package: ${error.message}`)
        }
        return 'error'
    }
    return 'ok'
}

function autoStartBounce() {
    if (AUTO_START_BOUNCE) {
        logger.info('AUTO_START_BOUNCE is enabled, starting bounce process in 10 seconds...')
        setTimeout(async () => {
            logger.info('Bouncing initial package to next node...')
            const result = await bouncePackage(NEXT_NODE, INITIAL_PACKAGE)
            logger.info(`Initial package bounce result: ${result}`)
        }, 10000)
    }
}

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
    logger.info('GET: /')
    res.send(index)
})

app.get('/bounce/:number', async (req, res) => {
    const result = await bouncePackage(NEXT_NODE, INITIAL_PACKAGE)
    res.send(result)
})

app.post('/bounce', async (req, res) => {
    const p = req.body
    p.bounceCount += 1
    p.number = randomizeNewNumber(p.number)
    currentPackage = p
    bouncePackage(NEXT_NODE, currentPackage)
    res.send(`ok`)
})

app.get('/stream', (req, res) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    })
    res.flushHeaders()

    const interval = setInterval(() => {
        const now = Date.now()
        if (currentPackage) {
            const packageToBeSent = {
                ...currentPackage,
                elapsed: humanizeDuration(now - currentPackage.start),
                lastUpdated: new Date(now).toISOString()
            }
            res.write(`data: ${JSON.stringify(packageToBeSent)}\n\n`)
        }

    }, 1000)

    req.on('close', () => {
        clearInterval(interval)
        res.end()
    })
})

app.listen(PORT)

logger.info(`Bouncer listening at http://localhost:${PORT}`)

autoStartBounce()
