const mongoose = require('mongoose');
const sharp = require('sharp');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Users = require('../models/users');
const Notifications = require('../models/notifications');

exports.user_register = (req, res, next) => {
  const form = req.body;

  Users.find({ userLower: form.username.toLowerCase() })
    .exec()
    .then(user => {
      if (user.length > 0) {
        let error = {error: "This username is already registered"};
        res.status(422).json(error);
      } else {
        bcrypt.hash(form.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err
            });
          } else {
            const user = new Users({
              _id: new mongoose.Types.ObjectId(),
              username: form.username,
              userLower: form.username.toLowerCase(),
              password: hash
            });
            user.save()
              .then(result => {
                res.status(201).json({
                  message: "User Created"
                });
              })
              .catch(error => {
                res.status(500).json({
                  error: "An unexpected error has occurred"
                })
              });
          }
        });
      }
    })
    .catch(err => {
      res.status(500).json({ error: err });
    })
};

exports.user_login = (req, res, next) => {
  const form = req.body;
  const username = req.body.username.toLowerCase()

  Users.findOne({ userLower: username })
    .exec()
    .then(user => {
      if (!user) {
        return res.status(401).json({
          error: 'Invalid username or password'
        });
      }
      bcrypt.compare(form.password, user.password, (err, result) => {
        if (err) {
          return res.status(401).json({
            error: 'Invalid username or password'
          });
        }
        if (result) {
          const token = jwt.sign({
            username: user.username,
            userId: user._id,
          },
          process.env.JWT_KEY
          );
          return res.status(200).json({
            message: 'Login successful',
            user: {
              _id: user._id,
              username: user.username,
              profPic: user.profPic,
              profIcon: user.profIcon,
              active: user.active,
              following: user.following,
              bookmarks: user.bookmarks,
              notifications: user.notifications,
              displayName: user.displayName
            },
            token: token
          });
        }
        res.status(401).json({
          message: 'Invalid username or password'
        });
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      })
    });
};

exports.user_delete = (req, res, next) => {
  const id = req.params.userId;

  Users.deleteOne({ _id: id })
    .exec()
    .then(result => {
      res.status(200).json({
        message: 'User deleted'
      });
    })
    .catch(err => {
      res.status(500).json({ error: err });
    });
};

exports.user_get_all = (req, res, next) => {
  Users.find()
  .select('username profPic profIcon active')
  .exec()
  .then(user => {
    if(!user) {
      return res.status(404).json({
        message: 'No users found'
      });
    }
    res.status(200).json(user);
  })
  .catch(err => {
    res.status(500).json({ error: err })
  })
}

exports.user_get_by_id = (req, res, next) => {
  Users.findOne({ _id: req.params.userId })
  .select('username profPic profIcon following followers posts bookmarks displayName profDescription')
  .populate('following', 'username profIcon')
  .populate('followers', 'username profIcon')
  .populate('posts', 'postBody likes comments')
    .exec()
    .then(user => {
      if(!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      res.status(200).json(user);
    })
    .catch(err => {
      res.status(500).json({ error: err });
    });
};

exports.user_get_by_username = (req, res, next) => {
  Users.findOne({ username: req.params.username })
  .select('username profPic profIcon following followers posts bookmarks displayName profDescription')
  .populate('following', 'username profIcon')
  .populate('followers', 'username profIcon')
  .populate('posts', 'postBody likes comments')
    .exec()
    .then(user => {
      if(!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      res.status(200).json(user);
    })
    .catch(err => {
      res.status(500).json({ error: err });
    });
};

exports.user_update_bookmark = (req, res, next) => {

  Users.findOne({_id: req.body.userId})
    .then(user => {
      if(user.bookmarks.indexOf(req.body.postId) === -1)
        user.bookmarks.push(req.body.postId);
      else
        user.bookmarks.pull(req.body.postId);
      user.save();
      res.status(200).json({ message: "Bookmarked successfully updated."});
    })
  .catch(err => {
    res.status(500).json({ error: "An error has occurred" });
  })
};

exports.user_deactivate_account = (req, res, next) => {
  Users.findOne({ _id: req.body.id })
  .exec()
  .then(user => {
    if(user.active)
      user.active = false;
    else
      user.active = true;
    user.save();
    res.status(200).json(user);
  })
  .catch(err => {
    res.status(500).json({ error: "An error has occurred" });
  })
};

exports.user_update_follow = (req, res, next) => {
  const user1 = req.body.userIdOne;
  const user2 = req.body.userIdTwo;
  let followed = false;

  Users.find({
    _id: { $in: [
      user1,
      user2
    ]}
  })
  .select('profPic active following followers posts bookmarks _id username')
  .exec()
  .then(user => {
    let follower, following;

    if (user[0]._id == user1) {
      follower = user[0];
      following = user[1];
    } else {
      follower = user[1];
      following = user[0];
    }

    if (follower.following.indexOf(following._id) === -1) {
      follower.following.push(following);
      following.followers.push(follower);
      followed = true;
    }
    else {
      follower.following.pull(following);
      following.followers.pull(follower);
    }
    user[0].save();
    user[1].save();
  })
  .then(() => {
    if (followed) {
      let notificationId = new mongoose.Types.ObjectId();
      const notification = new Notifications({
        _id: notificationId,
        user: user1,
        regarding: "Follow"
      });
      notification.save();

    Users.findOneAndUpdate({ _id: user2 },
      { $push: { notifications: notificationId } },
      function (error, success) {
        if (error) {
          res.status(500).json({ error: "An error occurred while adding NotificationID: " + notificationId });
        }
      });
    };
    res.status(200).json({ message: "Follow successfully updated" });
  })
  .catch(err => {
    res.status(500).json({ error: "An error has occurred" });
  })
};

exports.user_upload_profile_picture = async (req, res, next) => {
  let date = Date.now();
  let filename = req.body.userId + date + ".jpg";

  try {
    await sharp(req.file.buffer)
      .resize({ width: 200, height: 200 })
      .toFile('./uploads/' + filename);
    await sharp(req.file.buffer)
      .resize({ width: 55, height: 55 })
      .toFile('./uploads/icon-' + filename);
  } catch(error) {
    res.status(500).json({ error: "An error occurred while processing image."});
  }
  try {
    Users.findOneAndUpdate({ _id: req.body.userId },
      { $set: { profPic: `${process.env.BASE_URL}uploads/${filename}`,
                profIcon: `${process.env.BASE_URL}uploads/icon-${filename}`} },
        function (error, success) {
          if (error) {
            res.status(500).json({ error: "An error occurred while uploading profile picture"});
          }
      }
    );
    res.status(201).json({ message: "Profile picture successfully uploaded."})
  } catch(error) {
    res.status(500).json({ error: "An error occurred while uploading profile image"});
  }
}

exports.user_update_username = async (req, res, next) => {
  try {
    const user = Users.findOneAndUpdate({ _id: req.body.userId },
      { $set: { username: req.body.username } },
      function (error, success) {
        if (error) {
          res.status(500).json({ error: "An error occurred while updating username" })
        }
      });
      res.status(200).json({ message: "Username updated." })
  } catch(error) {
    res.status(500).json({ error: "An error occurred while updating username" });
  }
};

exports.user_update_display_name = async (req, res, next) => {
  try {
    const user = Users.findOneAndUpdate({ _id: req.body.userId },
      { $set: { displayName: req.body.displayName } },
      function (error, success) {
        if (error) {
          res.status(500).json({ error: "An error occurred while updating username" })
        }
      });
      res.status(200).json({ message: "Display name updated." })
  } catch(error) {
    res.status(500).json({ error: "An error occurred while updating username" });
  }
};

exports.user_update_description = async (req, res, next) => {
  try {
    const user = Users.findOneAndUpdate({ _id: req.body.userId },
      { $set: { profDescription: req.body.description } },
      function (error, success) {
        if (error) {
          res.status(500).json({ error: "An error occurred while updating username" })
        }
      });
      res.status(200).json({ message: "Description updated." })
  } catch(error) {
    res.status(500).json({ error: "An error occurred while updating username" });
  }
};