const express = require('express');
const router = express.Router();

const courses = require('../data/courses.json');

router.get('/', (req, res) => {
  res.json(courses);
});

router.get('/:id', (req, res) => {
  const course = courses.find((c) => c.id === parseInt(req.params.id));
  if (course) {
    res.json(course);
  } else {
    res.status(404).json({ error: 'Course not found' });
  }
});

module.exports = router;
