const Card = require('../models/card');
const NotFoundError = require('../errors/notFoundError');
const ForbiddenError = require('../errors/forbiddenError');

const getAllCards = ((req, res) => {
  Card.find({})
    .then((card) => res.send({ data: card }))
    .catch(() => res.status(500).send({ message: 'Произошла ошибка' }));
});

const createCard = ((req, res) => {
  const { name, link } = req.body;
  Card.create({ name, link, owner: req.user._id })
    .then((newCard) => res.send({ data: newCard }))
    .catch((err) => res.status(500).send({ message: err.message }));
});

const deleteCard = ((req, res) => {
  Card.findById(req.params.cardId)
    .then((card) => {
      if (!card) {
        return Promise.reject(new NotFoundError('Ошибка, карточки с таким id нет'));
      }
      return card.owner;
    })
    .then((cardOwner) => {
      if (cardOwner === req.user._id) {
        return Card.findByIdAndRemove({ _id: req.params.cardId })
          .then(() => res.send({ message: 'Карточка успешно удалена' }));
      }
      return Promise.reject(new ForbiddenError('Вы можете удалять только свои карточки'));
    })
    .catch((err) => {
      const statusCode = err.statusCode || 500;
      const message = statusCode === 500 ? 'Произошла ошибка' : err.message;
      res.status(statusCode).send({ message });
    });
});

const likeCard = ((req, res) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  )
    .orFail(() => new NotFoundError('Ошибка, не удалось поставить лайк, карточки с таким id нет'))
    .then(() => res.send({ message: 'Карточка лайкнута' }))
    .catch((err) => {
      const statusCode = err.statusCode || 500;
      const message = statusCode === 500 ? 'Произошла ошибка' : err.message;
      res.status(statusCode).send({ message });
    });
});

const dislikeCard = ((req, res) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  )
    .orFail(() => new NotFoundError('Ошибка, не удалось снять лайк, карточки с таким id нет'))
    .then(() => res.send({ message: 'Лайк с карточки успешно убран' }))
    .catch((err) => {
      const statusCode = err.statusCode || 500;
      const message = statusCode === 500 ? 'Произошла ошибка' : err.message;
      res.status(statusCode).send({ message });
    });
});

module.exports = {
  getAllCards,
  createCard,
  deleteCard,
  likeCard,
  dislikeCard,
};
