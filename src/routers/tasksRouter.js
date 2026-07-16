const express = require('express');
const prisma = require('../prismaClient');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      include: { assignee: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const task = await prisma.task.create({ data: req.body });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
