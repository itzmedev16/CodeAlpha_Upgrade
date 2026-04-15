const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const mongoose = require('mongoose');
const User = require('../models/User');

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password').limit(10);
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// Get user profile by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'name username')
      .populate('following', 'name username');
      
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Toggle Follow a user
router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }

    // 🟢 SAFE CHECK
    const isFollowing = currentUser.following.some(
      id => id.toString() === req.params.id
    );

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== req.params.id
      );

      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== req.user.id
      );
    } else {
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
    }

    await currentUser.save();
    await targetUser.save();

    return res.json({
      isFollowing: !isFollowing,
      followers: targetUser.followers
    });

  } catch (err) {
    console.error("🔥 FOLLOW ERROR FULL:", err); // 👈 IMPORTANT
    return res.status(500).json({ message: err.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error("FOLLOW ERROR:", err);
      res.status(500).json({ message: err.message });
  }
});

module.exports = router;
