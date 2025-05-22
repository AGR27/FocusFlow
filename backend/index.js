const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // allow all cross-origin requests
app.use(express.json()); // parse incoming JSON payloads

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Hello from backend!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
