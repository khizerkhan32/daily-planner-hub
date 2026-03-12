const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:      { type: String, required: true },
  priority:   { type: String, enum: ['low','medium','high'], default: 'medium' },
  status:     { type: String, enum: ['pending','done'], default: 'pending' },
  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now },
  description: { type: String },
  dueDate:       { type: String },
});

module.exports = mongoose.model('Task', taskSchema);