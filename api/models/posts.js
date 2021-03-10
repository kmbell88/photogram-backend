const mongoose = require('mongoose');

const postsSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  postBody: {
    imgUrl: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    }
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comments'
    }
  ],
  deleted: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Posts', postsSchema);