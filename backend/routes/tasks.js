const express = require('express');
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const { route } = require('./auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const task = new Task({
      user: req.userId,
      title: req.body.title,
      priority: req.body.priority || 'medium',
      description: req.body.description,
      dueDate: req.body.dueDate
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    Object.assign(task, req.body);
    if(req.body.completed) task.status = 'done';
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.status = 'done';
    await task.save();
    res.json(task);
  }
  catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

router.get('/all', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });  
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});