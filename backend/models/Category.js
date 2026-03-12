const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  color: { type: String, default: '#FFFFFF' },
  is_default: { type: Boolean, default: false }
});
categorySchema.index({ user_id: 1 });
module.exports = mongoose.model('Category', categorySchema);