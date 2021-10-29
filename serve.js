const express = require('express');

const app = express()

app.use("/", express.static('dist'));

app.listen(8080, "0.0.0.0", () => {
  console.log(`DelayMap listening at http://0.0.0.0:${8080}`)
})
