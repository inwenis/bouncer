const express = require('express')
const logger = require('pino')()

const app = express()
const port = 3000

app.get('/', (req, res) => {
    logger.info('hello world')
    res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
