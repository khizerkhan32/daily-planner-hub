const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const Task = require('../models/Task');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId, status: 'pending' });

    // Call ML service
    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/rank`, {
      tasks: tasks.map(t => ({
        _id: t._id,
        title: t.title,
        priority: t.priority,
        createdAt: t.createdAt
      }))
    });

    res.json(mlResponse.data);
  } catch (err) {
    console.error(err);
    // Fallback: sort by priority
    const tasks = await Task.find({ user: req.userId, status: 'pending' })
      .sort({ priority: -1, createdAt: 1 });
    res.json(tasks);
  }
});

module.exports = router;