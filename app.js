const express = require('express')
const logger = require('pino')()
const axios = require('axios')

const app = express()
const port = process.env.PORT || 3000

const NEXT_NODE = process.env.NEXT_NODE || 'http://localhost:3000'

let currentPackage = null

function performMagic(package) {
    const randomNumber = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    return randomNumber;
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
                    const eventSource = new EventSource('/stream');
                    eventSource.onmessage = function(event) {
                        document.getElementById('output').textContent = event.data + "\\n";
                    };
                </script>
            </body>
        </html>
  `)
})

app.get('/bounce/:package', (req, res) => {
    currentPackage = req.params.package
    logger.debug('GET: /bounce/%s', req.params.package)
    const newPackage = performMagic(req.params.package)
    logger.debug('new package: %s', newPackage)
    // do not await the call as we do not care about the response
    // we just want to send a request to the next node
    currentPackage = newPackage
    axios.get(`${NEXT_NODE}/bounce/${newPackage}`)
    res.send(`ok`)
})

app.get('/stream', (req, res) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.flushHeaders();

    const interval = setInterval(() => {
        res.write(`data: ${currentPackage}\n\n`);
    }, 1000);

    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
});

app.listen(port, () => {
    logger.info(`Bouncer listening at http://localhost:${port}`)
})
