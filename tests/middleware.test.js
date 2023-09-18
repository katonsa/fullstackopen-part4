const tokenExtractor = require('../utils/middleware').tokenExtractor

describe('tokenExtractor', () => {
  test('returns null when there is no token', () => {
    const request = {
      get: () => null
    }
    const response = {}
    const next = () => {}

    tokenExtractor(request, response, next)

    expect(request.token).toBe(null)
  })

  test('returns null when the token is in the wrong format', () => {
    const request = {
      get: () => 'token'
    }
    const response = {}
    const next = () => {}

    tokenExtractor(request, response, next)

    expect(request.token).toBe(null)
  })

  test('returns the token when there is a token with correct format', () => {
    const request = {
      get: () => 'Bearer token'
    }
    const response = {}
    const next = () => {}

    tokenExtractor(request, response, next)

    expect(request.token).toBe('token')
  })
})
