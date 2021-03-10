const mongoose = require('mongoose');

const commentsSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  comment: {
    type: String,
    required: true
  },
  commentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  commentPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Posts',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comments', commentsSchema);