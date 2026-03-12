const mongoose = require('mongoose');
const templateSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  tasks_json: { type: String, required: true }  // JSON string of task array
});
module.exports = mongoose.model('TaskTemplate', templateSchema);