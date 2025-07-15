const express = require('express')
const logger = require('pino')()

const app = express()
const port = 3000

const NEXT_NODE = process.env.NEXT_NODE || 'http://localhost:3000'

function performMagic(package) {
    logger.info('performing magic on package: %s', package)
    const randomNumber = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    return randomNumber;
}

app.get('/', (req, res) => {
    logger.info('hello world')
    res.send('Hello World!')
})

app.get('/bounce/:package', (req, res) => {
    logger.info('GET: /bounce/%s', req.params.package)
    const newPackage = performMagic(req.params.package)
    logger.info('new package: %s', newPackage)
    res.send(`ok`)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
