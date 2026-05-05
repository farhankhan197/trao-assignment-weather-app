import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3001;

app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Weather API is active" });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});