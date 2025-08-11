const fs = require('fs')
var https = require('https')
var http = require('http')
const express = require('express')
const pino = require('pino')
const axios = require('axios')
const axiosRetry = require('axios-retry').default;
const { AxiosError } = require('axios')
const humanizeDuration = require('humanize-duration')
const config = require('config')

// specify timezone so logs are in the same tz regardless of machine
process.env.TZ = "Europe/Warsaw"

// I use pino-pretty also in produciton because it's easier to work with logs in render.com
// in prettyfied format
const logger = pino(config.get('pino'))

function logRetry(retryCount, error, requestConfig) {
    logger.warn({ retryCount, url: requestConfig.url, code: error.code }, `Retrying request due to error`)
}

const retryPolicy = {
    retries: 10,
    retryDelay: axiosRetry.exponentialDelay,
    onRetry: logRetry,
    // by default POST requests are not retried because they
    // are not idempotent, we use POST request here and we want to retry them
    retryCondition: () => true
}

axiosRetry(axios, retryPolicy)

const PORT_HTTP                     = config.get('portHttp')
const PORT_HTTPS                    = config.get('portHttps')
const NEXT_NODE                     = config.get('nextNode')
const AUTO_START_BOUNCE             = config.get('autoStartBounce')
const AUTO_START_BOUNCE_DELAY_MS    = config.get('autoStartBounceDelayMs')
const CLIENT_PUSH_MESSAGES_DELAY_MS = config.get('clientPushMessagesDelayMs')
const INITIAL_PACKAGE = {
    start: Date.now(),
    bounceCount: 0,
    number: 42
}
const SSL_KEY_PATH  = config.has('sslKeyPath')  ? fs.readFileSync(config.get('sslKeyPath'))  : undefined
const SSL_CERT_PATH = config.has('sslCertPath') ? fs.readFileSync(config.get('sslCertPath')) : undefined
const SSL_CA_PATH   = config.has('sslCaPath')   ? fs.readFileSync(config.get('sslCaPath'))   : undefined

var options = {
    key:  SSL_KEY_PATH,
    cert: SSL_CERT_PATH,
    ca:   SSL_CA_PATH
}

const indexTemplate = fs.readFileSync(__dirname + '/index.html', 'utf-8')
let index = indexTemplate
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
        logger.info(`AUTO_START_BOUNCE is enabled, starting bounce process in ${humanizeDuration(AUTO_START_BOUNCE_DELAY_MS)}...`)
        setTimeout(async () => {
            logger.info('Bouncing initial package to next node...')
            const result = await safePostBounce(NEXT_NODE, INITIAL_PACKAGE)
            logger.info(`Initial package bounce result: ${result}`)
        }, AUTO_START_BOUNCE_DELAY_MS)
    } else {
        logger.info('AUTO_START_BOUNCE is disabled, no initial bounce will occur.')
    }
}

function currentPackageToJson() {
    if (currentPackage) {
        const now = Date.now()
        const updated = {
            ...currentPackage,
            elapsed: humanizeDuration(now - currentPackage.start),
            lastUpdated: new Date(now).toISOString()
        }
        const asAstring = JSON.stringify(updated, null, 2)
        return asAstring
    } else {
        return '{}'
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

function startUpdateTimer(res, req) {
    const interval = setInterval(() => {
        // for transfering we need to escape newlines to ensure the whole json is transferent as a single event
        const asAstring = currentPackageToJson().replaceAll('\n', '\\n')
        res.write(`data: ${asAstring}\n\n`)
    }, CLIENT_PUSH_MESSAGES_DELAY_MS)

    req.on('close', () => {
        clearInterval(interval)
        res.end()
    })
}

async function processAndForward(incommingPackage) {
    // simulate complicated processing
    // also makes my plan at render.com last longer (I think)
    await new Promise(resolve => setTimeout(resolve, 1000))
    incommingPackage.bounceCount += 1
    incommingPackage.number = randomizeNewNumber(incommingPackage.number)
    currentPackage = incommingPackage
    safePostBounce(NEXT_NODE, currentPackage)
}

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
    logger.info('GET: /')
    res.send(index)
})

app.get('/stream', (req, res) => {
    logger.info('GET: /stream')
    startEventStream(res)
    startUpdateTimer(res, req)
})

app.post('/bounce', async (req, res) => {
    logger.debug('POST: /bounce') // log as debug to avoid flooding logs
    await processAndForward(req.body)
    res.send('ok')
})



http.createServer(app).listen(PORT_HTTP)
https.createServer(options, app).listen(PORT_HTTPS)

logger.info(`Bouncer listening at http://localhost:${PORT_HTTP}`)
logger.info(`Bouncer listening at https://localhost:${PORT_HTTPS}`)

autoStartBounce()

setInterval(() => {
    index = indexTemplate.replace('xxx', currentPackageToJson())
}, 1000)
