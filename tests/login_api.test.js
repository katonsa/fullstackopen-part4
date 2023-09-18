const mongoose = require('mongoose')
const supertest = require('supertest')
const api = supertest(require('../app'))
const helper = require('./test_helper')
const User = require('../models/user')

beforeAll(async () => {
  await User.deleteMany({})
  await helper.createUsersInDb(helper.initialUsers)
})

afterAll(async () => {
  await mongoose.connection.close()
})

describe('login / authentication', () => {
  test('succeeds with valid credentials', async () => {
    const response = await api
      .post('/api/login')
      .send({
        username: helper.initialUsers[0].username,
        password: helper.initialUsers[0].password
      })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(response.body.token).toBeDefined()
  })

  test('fails with invalid credentials', async () => {
    const response = await api
      .post('/api/login')
      .send({
        username: helper.initialUsers[0].username,
        password: 'wrong'
      })
      .expect(401)
      .expect('Content-Type', /application\/json/)

    expect(response.body.token).not.toBeDefined()
  })
})
