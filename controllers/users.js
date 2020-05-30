require('dotenv').config();

const { NODE_ENV, JWT_SECRET } = process.env;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFoundError = require('../errors/notFoundError');
const BadRequest = require('../errors/badRequest');
const InternalServerError = require('../errors/internalServerError');
const Unauthorized = require('../errors/unauthorized');
const Conflict = require('../errors/conflict');
const handlerErrors = require('../errors/handlerErrors');

const login = ((req, res, next) => {
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
    .catch(() => {
      next(new Unauthorized('Необходима авторизация'));
    });
});

const getAllUsers = ((req, res, next) => {
  User.find({})
    .then((allUsers) => res.send({ data: allUsers }))
    .catch(() => next(new InternalServerError('Произошла ошибка')));
});

const getUser = (req, res, next) => {
  User.findById(req.params.userId)
    .orFail(() => new NotFoundError('Пользователь с таким id не найден'))
    .then((user) => res.send({ data: user }))
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequest('Введены некорректные данные'));
      } else {
        handlerErrors(req, res, err);
      }
    });
};

const createUser = ((req, res, next) => {
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
            next(new BadRequest('Введены некорректные данные'));
          } else if (err.code === 11000) {
            next(new Conflict(`Указанный вами email: ${err.keyValue.email} уже используется`));
          } else {
            next(new InternalServerError('Произошла ошибка'));
          }
        });
    });
});

const updateUserProfile = ((req, res, next) => {
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
        next(new BadRequest('Введены некорректные данные'));
      } else {
        next(new InternalServerError('Произошла ошибка'));
      }
    });
});

const updateUserAvatar = ((req, res, next) => {
  User.findByIdAndUpdate(req.user._id, { avatar: req.body.avatar }, {
    new: true,
    runValidators: true,
    upsert: true,
  })
    .then((userProfile) => res.send({ data: userProfile }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequest('Введены некорректные данные'));
      } else {
        next(new InternalServerError('Произошла ошибка'));
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
