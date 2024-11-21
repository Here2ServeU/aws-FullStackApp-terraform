const express = require('express');
const cors = require('cors');
const coursesRouter = require('./routes/courses');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/courses', coursesRouter);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
