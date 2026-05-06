import express from 'express';

const app = express();
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.json({ message: "Weather API is active" });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});