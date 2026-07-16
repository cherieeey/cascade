const express = require('express');
const prisma = require('../prismaClient');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(members);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const member = await prisma.member.create({ data: req.body });
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
