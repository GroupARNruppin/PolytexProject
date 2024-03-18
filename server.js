const express = require("express");

const app = express();
const PORT = 5000;

async function server_init() {
  await app.listen(PORT, () => {
    console.log(`Server TEST is running on http://localhost:${PORT}`);
  });
}


module.exports = { server_init };
