require('dotenv').config();

const { NODE_ENV, JWT_SECRET } = process.env;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFoundError = require('../errors/notFoundError');
const BadRequest = require('../errors/badRequest');
const Unauthorized = require('../errors/unauthorized');
const Conflict = require('../errors/conflict');
const handlerErrors = require('../errors/handlerErrors');

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
      handlerErrors(req, res, new Unauthorized(`${err.message}`));
    });
});

const getAllUsers = ((req, res) => {
  User.find({})
    .then((allUsers) => res.send({ data: allUsers }))
    .catch((err) => handlerErrors(req, res, err));
});

const getUser = (req, res) => {
  User.findById(req.params.userId)
    .orFail(() => new NotFoundError('Пользователь с таким id не найден'))
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.name === 'CastError') {
        handlerErrors(req, res, new BadRequest(`Введены некорректные данные ${err.message}`));
      } else {
        handlerErrors(req, res, err);
      }
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
        .catch((err) => {
          if (err.name === 'ValidationError') {
            handlerErrors(req, res, new BadRequest(`Ошибка: ${err.message}`));
          } else if (err.code === 11000) {
            handlerErrors(req, res, new Conflict(`Указанный вами email: ${req.body.email} уже используется`));
          } else {
            handlerErrors(req, res, err);
          }
        });
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
    .catch((err) => {
      if (err.name === 'ValidationError') {
        handlerErrors(req, res, new BadRequest(`Ошибка: ${err.message}`));
      } else {
        handlerErrors(req, res, err);
      }
    });
});

const updateUserAvatar = ((req, res) => {
  User.findByIdAndUpdate(req.user._id, { avatar: req.body.avatar }, {
    new: true,
    runValidators: true,
    upsert: true,
  })
    .then((userProfile) => res.send({ data: userProfile }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        handlerErrors(req, res, new BadRequest(`Ошибка: ${err.message}`));
      } else {
        handlerErrors(req, res, err);
      }
    });
});

module.exports = {
  login,
  getAllUsers,
  getUser,
  createUser,
  updateUserProfile,
  updateUserAvatar,
};
