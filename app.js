const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { PORT, DATABASE_URL, DATABASE_OPTIONS } = require('./config');

const { createUser, login } = require('./controllers/users');

const app = express();
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect(DATABASE_URL, DATABASE_OPTIONS);

app.post('/signin', login);
app.post('/signup', createUser);
app.use('/cards', require('./routes/cards'));
app.use('/users', require('./routes/users'));

app.use('*', (req, res) => {
  res.status(404).send({ message: 'Запрашиваемый ресурс не найден' });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на ${PORT} порту`);
});
