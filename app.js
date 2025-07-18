const express = require('express')
const logger = require('pino')()
const axios = require('axios')
const { AxiosError } = require('axios')

const app = express()
const port = process.env.PORT || 3000

const NEXT_NODE = process.env.NEXT_NODE || 'http://localhost:3000'

let currentPackage = null

function randomizeNewNumber() {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
}

app.get('/', (req, res) => {
    logger.info('GET: /')
    res.send(`
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
        </html>
  `)
})

app.get('/bounce/:number', async (req, res) => {
    const initialPackage = {
        start: Date.now(),
        bounceCount: 0,
        number: req.params.number
    }
    const promise = axios({
        method: 'post',
        url: `${NEXT_NODE}/bounce`,
        data: initialPackage,
        headers: { 'Content-Type': 'application/json' }
    })
    res.send(`ok`)
    try {
        await promise
    } catch (error) {
        if (error instanceof AxiosError) {
            logger.error({url: error.config.url}, `Error bouncing package: ${error.message}`)
        } else {
            logger.error(`Error bouncing package: ${error.message}`)
        }
    }
})

app.post('/bounce', async (req, res) => {
    const p = req.body
    console.log(p.start)
    console.log(p.bounceCount)
    console.log(p.number)

    p.bounceCount += 1
    p.number = randomizeNewNumber(p.number)

    axios.post(`${NEXT_NODE}/bounce`, p)
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
        res.write(`data: ${currentPackage}\n\n`)
    }, 1000)

    req.on('close', () => {
        clearInterval(interval)
        res.end()
    })
})

app.use(express.json())
app.listen(port, () => {
    logger.info(`Bouncer listening at http://localhost:${port}`)
})
