const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:      { type: String, required: true, unique: true },
  role:       { type: String, enum: ['user', 'admin'], default: 'user' },
  password:   { type: String, required: true },
  name:       String,
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);