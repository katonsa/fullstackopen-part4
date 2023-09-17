const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')

const config = require('./utils/config')
const logger = require('./utils/logger')
const bloglistRouter = require('./controllers/bloglist')

mongoose.set('strictQuery', false)

logger.info('connecting to', config.MONGODB_URI.replace(/:(\w+)@/, ':<password>@'))

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.json())

app.use('/api/blogs', bloglistRouter)

module.exports = app
