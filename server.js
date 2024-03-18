const express = require("express");

const app = express();
const PORT = 3001;

async function server_init() {
  console.log("first")
  await app.listen(PORT, () => {
    console.log(`Server TEST is running on http://localhost:${PORT}`);
  });
}

module.exports = { server_init };
