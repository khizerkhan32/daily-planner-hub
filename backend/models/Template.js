const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  tasks: [{
    title: String,
    estimatedDuration: Number,
    category: String,
    priority: String
  }]
});

module.exports = mongoose.model('Template', templateSchema);