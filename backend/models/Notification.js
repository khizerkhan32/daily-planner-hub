const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  type: { type: String, enum: ['reminder', 'deadline'], required: true },
  scheduled_at: { type: Date, required: true },
  sent_at: { type: Date },
  status: { type: String, default: 'pending' }
});
notificationSchema.index({ user_id: 1, scheduled_at: 1 });
module.exports = mongoose.model('Notification', notificationSchema);