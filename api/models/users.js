const mongoose = require('mongoose');

const usersSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  username: {
    type: String,
    required: true
  },
  userLower: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    default: ""
  },
  password: {
    type: String,
    required: true
  },
  profPic: {
    type: String,
    default: ""
  },
  profIcon: {
    type: String,
    default: ""
  },
  profDescription: {
    type: String,
    default: ""
  },
  active: {
    type: Boolean,
    default: true
  },
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    }
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    }
  ],
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Posts'
    }
  ],
  bookmarks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Posts'
    }
  ],
  notifications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notifications'
    }
  ]
});

module.exports = mongoose.model('Users', usersSchema);
