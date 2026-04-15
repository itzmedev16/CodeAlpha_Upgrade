const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Get all posts (Feed)
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name username');
    
    // We also need comments. Let's fetch comments along with it.
    // For a real app, pagination is needed. Here we just fetch them all and inject comments.
    const postsWithComments = await Promise.all(posts.map(async (post) => {
      const comments = await Comment.find({ post: post._id }).populate('user', 'name username');
      return { ...post.toObject(), comments };
    }));

    res.json(postsWithComments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a post
router.post('/', auth, async (req, res) => {
  try {
    const newPost = new Post({
      content: req.body.content,
      user: req.user.id
    });

    const post = await newPost.save();
    const populatedPost = await Post.findById(post._id).populate('user', 'name username');
    
    res.json({ ...populatedPost.toObject(), comments: [] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Toggle Like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if liked
    const index = post.likes.findIndex(userId => userId.toString() === req.user.id);
    
    if (index > -1) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    
    // return likes count and if liked
    res.json({ likes: post.likes, hasLiked: index === -1 });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = new Comment({
      content: req.body.content,
      user: req.user.id,
      post: req.params.id
    });

    const comment = await newComment.save();
    const populatedComment = await Comment.findById(comment._id).populate('user', 'name username');

    res.json(populatedComment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
