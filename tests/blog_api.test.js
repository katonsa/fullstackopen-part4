const mongoose = require('mongoose')
const supertest = require('supertest')
const api = supertest(require('../app'))
const { blogsInDb, initialBlogs, createUsersInDb, initialUsers } = require('./test_helper')

const Blog = require('../models/blog')
const User = require('../models/user')
const { generateToken } = require('../utils/token')

let usersForTests = []

beforeAll(async () => {
  await User.deleteMany({})
  const users = await createUsersInDb(initialUsers)

  usersForTests = await Promise.all(users.map(async user => {
    return {
      ...user,
      token: generateToken({ username: user.username, id: user.id })
    }
  }))
})

afterAll(async () => {
  await mongoose.connection.close()
})

beforeEach(async () => {
  // cleanup the blogs posts
  await Blog.deleteMany({})
  const user = await User.findById(usersForTests[0].id)
  user.blogs = []
  await user.save()

  // create a blog posts belongs to user for each tests
  const blogsToSave = initialBlogs.map(blog => new Blog({
    ...blog,
    user: user.id
  }))
  const savedBlogs = await Promise.all(blogsToSave.map(blog => blog.save()))
  user.blogs = user.blogs.concat(savedBlogs.map(blog => blog._id))
  await user.save()
})

describe('when there is initially some blogs saved', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .set('authorization', `Bearer ${usersForTests[0].token}`)
      .expect(200)
      .expect('content-type', /application\/json/)
  })

  test('should return correct amount of blog posts', async () => {
    const response = await api
      .get('/api/blogs')
      .set('authorization', `Bearer ${usersForTests[0].token}`)
    expect(response.body).toHaveLength(initialBlogs.length)
  })

  test('should return specific blog post in returned blog posts', async () => {
    const response = await api
      .get('/api/blogs')
      .set('authorization', `Bearer ${usersForTests[0].token}`)

    const contents = response.body.map(r => r.title)
    expect(contents).toContain(
      'React patterns'
    )
  })

  test('unique identifier of blog posts should be named id', async () => {
    const response = await api
      .get('/api/blogs')
      .set('authorization', `Bearer ${usersForTests[0].token}`)

    expect(response.body[0].id).toBeDefined()
    expect(response.body[0]._id).toBeUndefined()
  })

  test('blog post should have user property', async () => {
    const response = await api
      .get('/api/blogs')
      .set('authorization', `Bearer ${usersForTests[0].token}`)

    expect(response.body[0]).toHaveProperty('user')
    expect(response.body[0].user).toHaveProperty('username')
    expect(response.body[0].user).toHaveProperty('name')
    expect(response.body[0].user).toHaveProperty('id')
  })
})

const newBlog = {
  title: 'npm audit: Broken by Design',
  author: 'Dan Abramov',
  url: 'https://overreacted.io/npm-audit-broken-by-design/',
  likes: 0,
}

describe('addition of a blog(post)', () => {
  test('fails if authorization header is missing', async () => {
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)

    const blogs = await blogsInDb()
    expect(blogs).toHaveLength(initialBlogs.length)
  })

  test('invalid token should fail and return status 401', async () => {
    await api
      .post('/api/blogs')
      .set('authorization', 'Bearer invalidtoken')
      .send(newBlog)
      .expect(401)

    const blogs = await blogsInDb()
    expect(blogs).toHaveLength(initialBlogs.length)
  })

  test('can create a new blog post with valid token', async () => {
    const response = await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${usersForTests[0].token}`)
      .send(newBlog)
      .expect(201)
      .expect('content-type', /application\/json/)

    // check if the response contains the user property
    expect(response.body).toHaveProperty('user', usersForTests[0].id)

    const blogsAfter = await blogsInDb()
    expect(blogsAfter).toHaveLength(initialBlogs.length + 1)

    // check if newlycreated blog post is in the database
    const titles = blogsAfter.map(p => p.title)
    expect(titles).toContain(newBlog.title)
  })

  test('property likes have default value of 0 when missing from the request', async () => {
    await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${usersForTests[0].token}`)
      .send(newBlog)
      .expect(201)
      .expect('content-type', /application\/json/)

    const blogsAfter = await blogsInDb()
    expect(blogsAfter).toHaveLength(initialBlogs.length + 1)

    const newlyAddedBlog = blogsAfter.find(blog => blog.title === newBlog.title)
    expect(newlyAddedBlog).toHaveProperty('likes', 0)
  })

  test('when required properties are missing should return bad response', async () => {
    await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${usersForTests[0].token}`)
      .send({ ...newBlog, title: undefined })
      .expect(400)

    await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${usersForTests[0].token}`)
      .send({ ...newBlog, url: undefined })
      .expect(400)
  })
})

describe('deletion of a blog(post)', () => {
  test('fails with status 401 if token invalid', async () => {
    const blogsBefore = await blogsInDb()
    const blogToDelete = blogsBefore[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('authorization', 'Bearer invalidtoken')
      .expect(401)

    const blogsAfter = await blogsInDb()
    expect(blogsAfter).toHaveLength(initialBlogs.length)
    const titles = blogsAfter.map(blog => blog.title)
    expect(titles).toContain(blogToDelete.title)
  })

  test('succeeds with status code 204 if id and token is valid', async () => {
    const blogsBefore = await blogsInDb()
    const blogToDelete = blogsBefore[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('authorization', `Bearer ${usersForTests[0].token}`)
      .expect(204)

    const blogsAfter = await blogsInDb()
    expect(blogsAfter).toHaveLength(initialBlogs.length - 1)
    const titles = blogsAfter.map(blog => blog.title)
    expect(titles).not.toContain(blogToDelete.title)
  })

  test('fails with status code 401 if user of the valid token is not the creator', async () => {
    const blogsBefore = await blogsInDb()
    const blogToDelete = blogsBefore[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('authorization', `Bearer ${usersForTests[1].token}`)
      .expect(401)

    const blogsAfter = await blogsInDb()
    expect(blogsAfter).toHaveLength(initialBlogs.length)
    const titles = blogsAfter.map(blog => blog.title)
    expect(titles).toContain(blogToDelete.title)
  })
})

describe('updating a blog(post)', () => {
  test('succeeds with valid data and token', async () => {
    const itemsBeforeChanges = await blogsInDb()
    const itemToUpdate = itemsBeforeChanges[0]

    await api
      .put(`/api/blogs/${itemToUpdate.id}`)
      .set('authorization', `Bearer ${usersForTests[0].token}`)
      .send({ ...itemToUpdate, likes: 99 })
      .expect(200)

    const itemsAfterChanges = await blogsInDb()
    const updatedItem = itemsAfterChanges.find(item => item.title === itemToUpdate.title)
    expect(updatedItem.likes).toBe(99)
  })
})
