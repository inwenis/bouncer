const express = require('express')
const logger = require('pino')()
const axios = require('axios')

const app = express()
const port = process.env.PORT || 3000

const NEXT_NODE = process.env.NEXT_NODE || 'http://localhost:3000'

let currentPackage = null

function performMagic(package) {
    logger.info('performing magic on package: %s', package)
    const randomNumber = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    return randomNumber;
}

app.get('/', (req, res) => {
    logger.info('GET: /')
    res.send(`Current package: ${currentPackage}`)
})

app.get('/bounce/:package', (req, res) => {
    currentPackage = req.params.package
    logger.info('GET: /bounce/%s', req.params.package)
    const newPackage = performMagic(req.params.package)
    logger.info('new package: %s', newPackage)
    // do not await the call as we do not care about the response
    // we just want to send a request to the next node
    currentPackage = newPackage
    axios.get(`${NEXT_NODE}/bounce/${newPackage}`)
    res.send(`ok`)
})

app.listen(port, () => {
    logger.info(`Bouncer listening at http://localhost:${port}`)
})
