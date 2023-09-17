const bloglistRouter = require('express').Router()
const Blog = require('../models/blog')

bloglistRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
  return response.json(blogs)
})

bloglistRouter.post('/', async (request, response) => {
  const body = request.body

  const blog = new Blog({
    ...body,
    likes: body.likes || 0
  })

  const savedBlog = await blog.save()
  response.status(201).json(savedBlog)
})

module.exports = bloglistRouter
