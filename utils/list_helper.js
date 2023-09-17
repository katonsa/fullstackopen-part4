const _ = require('lodash')

// eslint-disable-next-line no-unused-vars
const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  if (blogs.length === 0) return 0
  return blogs.reduce((sum, b) => sum+=b.likes, 0)
}

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) return null
  const sorted = blogs.sort((a, b) => b.likes - a.likes)
  const favorite = sorted[0]
  return {
    title: favorite.title,
    author: favorite.author,
    likes: favorite.likes,
  }
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) return null

  return _.chain(blogs)
    .groupBy('author')
    .map((blogs, author) => ({ author, blogs: blogs.length }))
    .maxBy('blogs')
    .value()
}

const mostLikes = (blogs) => {
  if (blogs.length === 0) return null

  return _.chain(blogs)
    .groupBy('author')
    .map((blogs, author) => ({ author, likes: _.sumBy(blogs, 'likes') }))
    .maxBy('likes')
    .value()
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}
