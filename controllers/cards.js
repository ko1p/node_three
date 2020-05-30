const Card = require('../models/card');
const NotFoundError = require('../errors/notFoundError');
const ForbiddenError = require('../errors/forbiddenError');
const BadRequest = require('../errors/badRequest');
const InternalServerError = require('../errors/internalServerError');
const handlerErrors = require('../errors/handlerErrors');

const getAllCards = ((req, res, next) => {
  Card.find({})
    .then((card) => res.send({ data: card }))
    .catch(() => next(new InternalServerError('Произошла ошибка')));
});

const createCard = ((req, res, next) => {
  const { name, link } = req.body;
  Card.create({ name, link, owner: req.user._id })
    .then((newCard) => res.send({ data: newCard }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequest(`Введены некорректные данные ${err.message}`));
      } else {
        next(new InternalServerError('Произошла ошибка'));
      }
    });
});

const deleteCard = ((req, res, next) => {
  Card.findById(req.params.cardId)
    .orFail(() => new NotFoundError('Ошибка, карточки с таким id нет'))
    .then((card) => {
      if (card.owner.toString() === req.user._id) {
        card.remove();
        return res.send({ data: card });
      }
      return Promise.reject(new ForbiddenError('Вы можете удалять только свои карточки'));
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequest(`Введены некорректные данные ${err.message}`));
      } else {
        handlerErrors(req, res, err);
      }
    });
});

const likeCard = ((req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  )
    .orFail(() => new NotFoundError('Ошибка, не удалось поставить лайк, карточки с таким id нет'))
    .then(() => res.send({ message: 'Карточка лайкнута' }))
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequest(`Введены некорректные данные ${err.message}`));
      } else {
        handlerErrors(req, res, err);
      }
    });
});

const dislikeCard = ((req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  )
    .orFail(() => new NotFoundError('Ошибка, не удалось снять лайк, карточки с таким id нет'))
    .then(() => res.send({ message: 'Лайк с карточки успешно убран' }))
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequest(`Введены некорректные данные ${err.message}`));
      } else {
        handlerErrors(req, res, err);
      }
    });
});

module.exports = {
  getAllCards,
  createCard,
  deleteCard,
  likeCard,
  dislikeCard,
};
