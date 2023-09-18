const jwt = require('jsonwebtoken')
const config = require('../utils/config')

const generateToken = (userForToken) => {
  return jwt.sign(
    userForToken,
    config.JWT_SECRET,
    { expiresIn: 60*60 }
  )
}

module.exports = {
  generateToken
}
