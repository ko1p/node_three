require('dotenv').config();

const { NODE_ENV, JWT_SECRET } = process.env;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFoundError = require('../errors/notFoundError');

const login = ((req, res) => {
  const { email, password } = req.body;
  User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign(
        { _id: user._id },
        NODE_ENV === 'production' ? JWT_SECRET : 'secKeyForDevelopment',
        { expiresIn: '7d' },
      );
      res.cookie('jwt', token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: true,
      });
      res.send({ token });
    })
    .catch((err) => {
      res.status(401).send({ message: err.message });
    });
});

const getAllUsers = ((req, res) => {
  User.find({})
    .then((allUsers) => res.send({ data: allUsers }))
    .catch(() => res.status(500).send({ message: 'Произошла ошибка' }));
});

const getUser = (req, res) => {
  User.findById(req.params.userId)
    .orFail(() => new NotFoundError('Пользователь с таким id не найден'))
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      const statusCode = err.statusCode || 500;
      const message = statusCode === 500 ? 'Произошла ошибка' : err.message;
      res.status(statusCode).send({ message });
    });
};

const createUser = ((req, res) => {
  const {
    name, email, password, about, avatar,
  } = req.body;
  bcrypt.hash(password, 10)
    .then((hash) => {
      User.create({
        name, email, password: hash, about, avatar,
      })
        .then((user) => res.send({ data: user }))
        .catch((err) => res.status(500).send({ message: err.message }));
    });
});

const updateUserProfile = ((req, res) => {
  User.findByIdAndUpdate(req.user._id, {
    name: req.body.name,
    about: req.body.about,
  }, {
    new: true,
    runValidators: true,
    upsert: true,
  })
    .then((userProfile) => res.send({ data: userProfile }))
    .catch((err) => res.status(500).send({ message: err.message }));
});

const updateUserAvatar = ((req, res) => {
  User.findByIdAndUpdate(req.user._id, { avatar: req.body.avatar }, {
    new: true,
    runValidators: true,
    upsert: true,
  })
    .then((userProfile) => res.send({ data: userProfile }))
    .catch((err) => res.status(500).send({ message: err.message }));
});

module.exports = {
  login,
  getAllUsers,
  getUser,
  createUser,
  updateUserProfile,
  updateUserAvatar,
};
