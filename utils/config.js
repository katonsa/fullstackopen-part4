require('dotenv').config()

const PORT = process.env.PORT ?? 3003
const MONGODB_URI = process.env.NODE_ENV === 'test'
  ? process.env.TEST_MONGODB_URI
  : process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET

module.exports = {
  JWT_SECRET,
  MONGODB_URI,
  PORT,
}
