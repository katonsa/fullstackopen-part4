const mongoose = require('mongoose')
const supertest = require('supertest')
const api = supertest(require('../app'))
const helper = require('./test_helper')

const Blog = require('../models/blog')

describe('blogs api integration test', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})

    for (const blog of helper.blogs) {
      let blogObject = new Blog(blog)
      await blogObject.save()
    }
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  test('should return as json', () => {
    api.get('/api/blogs')
      .expect(200)
      .expect('content-type', /application\/json/)
  })

  test('should return correct amount of blog posts', async () => {
    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(helper.blogs.length)
  })

  test('should return specific blog post in returned blog posts', async () => {
    const response = await api.get('/api/blogs')
    const contents = response.body.map(r => r.title)
    expect(contents).toContain(
      'React patterns'
    )
  })

  test('unique identifier of blog posts should be named id', async () => {
    const response = await api.get('/api/blogs')
    expect(response.body[0].id).toBeDefined()
    expect(response.body[0]._id).toBeUndefined()
  })

  test('can create a new blog post', async () => {
    const newBlog = {
      title: 'npm audit: Broken by Design',
      author: 'Dan Abramov',
      url: 'https://overreacted.io/npm-audit-broken-by-design/',
      likes: 0,
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('content-type', /application\/json/)

    const blogs = await helper.blogsInDb()
    expect(blogs).toHaveLength(helper.blogs.length + 1)

    const titles = blogs.map(p => p.title)
    expect(titles).toContain(newBlog.title)
  })

  test('property likes have default value of 0 when missing from the request', async () => {
    const newBlog = {
      title: 'npm audit: Broken by Design',
      author: 'Dan Abramov',
      url: 'https://overreacted.io/npm-audit-broken-by-design/',
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('content-type', /application\/json/)

    const blogs = await helper.blogsInDb()
    expect(blogs).toHaveLength(helper.blogs.length + 1)
    const newlyAdded = blogs.find(blog => blog.title === newBlog.title)
    expect(newlyAdded.likes).toBe(0)
  })

  test('when required properties are missing should return bad response', async () => {
    const newBlog = {
      title: 'npm audit: Broken by Design',
      author: 'Dan Abramov',
      url: 'https://overreacted.io/npm-audit-broken-by-design/',
    }

    await api
      .post('/api/blogs')
      .send({ ...newBlog, title: undefined })
      .expect(400)

    await api
      .post('/api/blogs')
      .send({ ...newBlog, url: undefined })
      .expect(400)
  })

  describe('deletion of a blog(post)', () => {
    test('succeeds with status code 204 if id is valid', async () => {
      const itemsBeforeDeletion = await helper.blogsInDb()
      const itemToDelete = itemsBeforeDeletion[0]

      await api
        .delete(`/api/blogs/${itemToDelete.id}`)
        .expect(204)

      const itemsAfterDeletion = await helper.blogsInDb()
      expect(itemsAfterDeletion).toHaveLength(helper.blogs.length - 1)
      const titles = itemsAfterDeletion.map(blog => blog.title)
      expect(titles).not.toContain(itemToDelete.title)
    })
  })

  describe('updating a blog(post)', () => {
    test('succeeds with valid data', async () => {
      const itemsBeforeChanges = await helper.blogsInDb()
      const itemToUpdate = itemsBeforeChanges[0]

      await api
        .put(`/api/blogs/${itemToUpdate.id}`)
        .send({ ...itemToUpdate, likes: 99 })
        .expect(200)

      const itemsAfterChanges = await helper.blogsInDb()
      const updatedItem = itemsAfterChanges.find(item => item.title === itemToUpdate.title)
      expect(updatedItem.likes).toBe(99)
    })
  })

})
