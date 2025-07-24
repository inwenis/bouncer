const express = require('express')
const pino = require('pino')
const axios = require('axios')
const axiosRetry = require('axios-retry').default;
const { AxiosError } = require('axios')
const humanizeDuration = require('humanize-duration')

// specify timezone so logs are in the same tz regardless of machine
process.env.TZ = "Europe/Warsaw"

// I use pino-pretty also in produciton because it's easier to work with logs in render.com
// in prettyfied format
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: false
    }
  }
})

axiosRetry(axios, { retries: 3 })

const PORT              = process.env.PORT              || 3000
const NEXT_NODE         = process.env.NEXT_NODE         || 'http://localhost:3000'
const AUTO_START_BOUNCE = process.env.AUTO_START_BOUNCE || false
const INITIAL_PACKAGE = {
    start: Date.now(),
    bounceCount: 0,
    number: 42
}

let currentPackage = null

function randomizeNewNumber() {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
}

async function safePostBounce(dest, package) {
    try {
        await axios({
            method: 'post',
            url: `${dest}/bounce`,
            data: package,
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
            const result = await safePostBounce(NEXT_NODE, INITIAL_PACKAGE)
            logger.info(`Initial package bounce result: ${result}`)
        }, 10000)
    } else {
        logger.info('AUTO_START_BOUNCE is disabled, no initial bounce will occur.')
    }
}

function sendUpdate(res) {
    return () => {
        if (currentPackage) {
            const now = Date.now()
            const updated = {
                ...currentPackage,
                elapsed: humanizeDuration(now - currentPackage.start),
                lastUpdated: new Date(now).toISOString()
            }
            const asAstring = JSON.stringify(updated, null, 2).replaceAll('\n', '\\n')
            res.write(`data: ${asAstring}\n\n`)
        }
    }
}

function startEventStream(res) {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    })
    res.flushHeaders()
}

function startUpdateTimer(res, req, delay) {
    const interval = setInterval(sendUpdate(res), delay)

    req.on('close', () => {
        clearInterval(interval)
        res.end()
    })
}

function processAndForward(incommingPackage) {
    incommingPackage.bounceCount += 1
    incommingPackage.number = randomizeNewNumber(incommingPackage.number)
    currentPackage = incommingPackage
    safePostBounce(NEXT_NODE, currentPackage)
}

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
    logger.info('GET: /')
    res.sendFile(__dirname + '/index.html')
})

app.get('/stream', (req, res) => {
    logger.info('GET: /stream')
    startEventStream(res)
    startUpdateTimer(res, req, 1000)
})

app.post('/bounce', async (req, res) => {
    logger.debug('POST: /bounce') // log as debug to avoid flooding logs
    processAndForward(req.body)
    res.send('ok')
})

app.listen(PORT)

logger.info(`Bouncer listening at http://localhost:${PORT}`)

autoStartBounce()
