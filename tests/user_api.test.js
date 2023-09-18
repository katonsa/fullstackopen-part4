const mongoose = require('mongoose')
const supertest = require('supertest')
const api = supertest(require('../app'))
const helper = require('./test_helper')

const User = require('../models/user')

beforeEach(async () => {
  await User.deleteMany({})
  await User.insertMany(helper.initialUsers)
})

afterAll(async () => {
  await mongoose.connection.close()
})

describe('when there is initially user in db', () => {
  test('return as json', async () => {
    await api.get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('return all users', async () => {
    const response = await api.get('/api/users')
    expect(response.body).toHaveLength(helper.initialUsers.length)
  })

  test('return a specific user', async () => {
    const response = await api.get('/api/users')
    const usernames = response.body.map(user => user.username)
    expect(usernames).toContain(helper.initialUsers[0].username)
  })
})

const newUser = {
  username: 'test',
  name: 'test',
  password: 'test'
}

describe('addition of a new user', () => {
  test('succeed with valid data and fresh username', async () => {
    await api.post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const users = await helper.usersInDb()
    expect(users).toHaveLength(helper.initialUsers.length + 1)

    const usernames = users.map(user => user.username)
    expect(usernames).toContain(newUser.username)
  })

  test('fails with status code 400 if username is not given', async () => {
    const response = await api.post('/api/users')
      .send({
        ...newUser,
        username: undefined
      })
      .expect(400)

    expect(response.body.error).toContain('Username is required')

    const users = await helper.usersInDb()
    expect(users).toHaveLength(helper.initialUsers.length)
  })

  test('fails with status code 400 if password is not given', async () => {
    const response = await api.post('/api/users')
      .send({
        ...newUser,
        password: undefined
      })
      .expect(400)

    expect(response.body.error).toContain('Password is required')

    const users = await helper.usersInDb()
    expect(users).toHaveLength(helper.initialUsers.length)
  })

  test('fails with status code 400 if username is too short', async () => {
    const response = await api.post('/api/users')
      .send({
        ...newUser,
        username: 'te',
      })
      .expect(400)

    expect(response.body.error).toContain('Username must be at least 3 characters long')

    const users = await helper.usersInDb()
    expect(users).toHaveLength(helper.initialUsers.length)
  })

  test('fails with status code 400 if password is too short', async () => {
    const response = await api.post('/api/users')
      .send({
        ...newUser,
        password: 'te',
      })
      .expect(400)

    expect(response.body.error).toContain('Password must be at least 3 characters long')

    const users = await helper.usersInDb()
    expect(users).toHaveLength(helper.initialUsers.length)
  })

  test('fails with status code 400 if username is not unique', async () => {
    const userToCreate = helper.initialUsers[0]

    const response = await api.post('/api/users')
      .send(userToCreate)
      .expect(400)

    expect(response.body.error).toContain('username must be unique')

    const users = await helper.usersInDb()
    expect(users).toHaveLength(helper.initialUsers.length)
  })
})
