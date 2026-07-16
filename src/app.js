const express = require('express');
const createError = require('http-errors');
const path = require('path');

const membersRouter = require('./routers/membersRouter');
const tasksRouter = require('./routers/tasksRouter');
const learningRouter = require('./routers/learningRouter');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/learning', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'learning', 'index.html'));
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

app.use('/api/members', membersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/learning', learningRouter);

app.use((req, _res, next) => {
  next(createError(404, `Unknown resource ${req.method} ${req.originalUrl}`));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: error.message || 'Unknown server error',
  });
});

module.exports = app;
