const express = require('express');
require('dotenv').config();
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const morgan = require('morgan');
const mongoose = require('mongoose');

app.use(cors());
app.use(morgan('dev'));

// Uploads folder for multer images
app.use('/uploads', express.static('uploads'));

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

// Routes
const usersRoutes = require('./api/routes/users');
const postsRoutes = require('./api/routes/posts')
app.use('/users', usersRoutes);
app.use('/posts', postsRoutes);

// MongoDB/Mongoose Setup
mongoose.connect(
  `mongodb+srv://kbell:${process.env.MONGODB_PW}@cluster0.4fv9v.mongodb.net/photogram?retryWrites=true&w=majority`,
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }
);

//------------ Error handling ------------//
app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  })
});
//----------------------------------------//

// Base URL
app.get('/', (req, res) => {
  res.status(200).json({ message: "Hello World!" });
});

// Start server
app.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});