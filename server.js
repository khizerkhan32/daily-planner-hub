const express = require('express');
const cors = require('cors');
const authRouter = require('./api/auth'); // Adjust path if needed

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
