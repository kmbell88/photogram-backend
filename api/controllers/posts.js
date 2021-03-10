const mongoose = require('mongoose');
const sharp = require('sharp');
const Posts = require('../models/posts');
const Users = require('../models/users');
const Notifications = require('../models/notifications');
const Comments = require('../models/comments');

exports.posts_get_all_posts = (req, res, next) => {
  Posts.find()
    .populate('postBody.postedBy', 'username profPic profIcon')
    .populate('likes', 'username profPic profIcon')
    .populate('comments')
    .exec()
    .then(posts => {
      if (!posts) {
        return(
          res.status(404).json({ message: "No posts found"})
        );
      }
      res.status(200).json(posts);
    })
    .catch(err => {
      res.status(500).json({ error: "An error has occurred" });
    });
};

exports.posts_get_post_by_id = (req, res, next) => {
  const postId = req.params.postId;

  Posts.findOne({ _id: postId })
    .populate('postBody.postedBy', 'username profPic profIcon')
    .populate('comments')
    .populate('likes', 'username profIcon')
    .exec()
    .then(post => {
      if(!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.status(200).json(post);
    })
    .catch(err => {
      res.status(500).json({ error: "An error has occurred" });
    });
};

exports.posts_update_post_text = (req, res, next) => {
  Posts.findOne({ _id: req.body.postId })
    .exec()
    .then(post => {
      if(!post) {
        return res.status(404).json({
          error: "Post not found"
        })
      }
      post.postBody.text = req.body.text;
      post.save();
      res.status(200).json(post);
    })
    .catch(err => {
      res.status(500).json({ error: "An error has occurred"});
    });
};

// Delete post by user; Posts is just deactivated, not actually deleted.
exports.posts_delete_post = (req, res, next) => {
  Posts.findOne({ _id: req.body.postId })
    .exec()
    .then(post => {
      if(!post) {
        return res.status(404).json({
          error: "Post not found"
        })
      }
      post.deleted = true;
      post.save();
      res.status(200).json(post);
    })
    .catch(err => {
      res.status(500).json({ error: "An error has occurred"});
    });
};

exports.posts_add_comment = (req, res, next) => {
  Posts.findOne({ _id: req.body.postId })
    .exec()
    .then(post => {
      if(!post) {
        return res.status(404).json({
          error: "Post not found"
        })
      }

      let commentId = new mongoose.Types.ObjectId();
      const newComment = new Comments({
        _id: commentId,
        comment: req.body.comment,
        commentBy: req.body.userId,
        commentPostId: req.body.postId
      });
      newComment.save();

      post.comments.push(commentId);
      post.save();
      res.status(201).json({ message: "Comment posted"})
    })
    .catch(err => {
      res.status(500).json({ error: "An error has occurred"});
    });
}

exports.posts_update_like = (req, res, next) => {
  let postLiked = false;

  Posts.findOne({ _id: req.body.postId })
    .then(post => {
      if(post.likes.indexOf(req.body.notification.user) === -1) {
        postLiked = true;
        post.likes.push(req.body.notification.user);
      }
      else
        post.likes.pull(req.body.notification.user);
      post.save();
    })
    .then(() => {
      if (postLiked) {
        let notificationId = new mongoose.Types.ObjectId();
        const newNotification = new Notifications({
          _id: notificationId,
          user: req.body.notification.user,
          regarding: req.body.notification.regarding,
          postId: req.body.notification.postId
        });
        newNotification.save();

        Users.findOneAndUpdate({ _id: req.body.postAuthorId },
          { $push: { notifications: notificationId } },
          function (error, success) {
            if (error) {
              res.status(500).json({ error: "An error occurred while adding NotificationID: " + notificationId });
            }
          });
      }
      res.status(200).json({ message: "Like successfully updated" });
    })
    .catch(err => {
      res.status(500).json({ error: "An error has occurred" });
    })
};

exports.posts_create_post = async (req, res, next) => {
  let postId = new mongoose.Types.ObjectId();
  let filename = postId + ".jpg"

  try {
    let sharpRes = await sharp(req.file.buffer)
      .resize({ width: 640, height: 640 })
      .toFile('./uploads/' + filename);
  } catch(error) {
    res.status(500).json({ error: "An error occurred while processing image."});
  }
  try {
    const post = new Posts({
      _id: postId,
      postBody: {
        imgUrl: `${process.env.BASE_URL}${filename}`,
        description: req.body.description,
        postedBy: req.body.userId
      }
    });
    post.save();

  } catch(error) {
    res.status(500).json({ error: "An error occurred while adding PostID: " + postId });
  }
  try {
    const user = Users.findOneAndUpdate({ _id: req.body.userId },
      { $push: { posts: postId } },
      function (error, success) {
        if (error) {
          res.status(500).json({ error: "An error occurred while adding PostID: " + postId });
        }
      }
    );
    res.status(201).json({ message: "Post Submitted"})
  } catch(error) {
    res.status(500).json({ error: "An error occurred while adding PostID: " + postId });
  }
};