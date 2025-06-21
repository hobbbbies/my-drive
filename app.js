// app.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');

// const indexRouter = require("./routes/indexRouter");
const uploadRouter = require("./routes/uploadRouter");
// const folderRouter = require("./routes/folderRouter");

require('dotenv').config();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// app.use("/", indexRouter);
app.use("/upload", uploadRouter);
// app.use("/folder", folderRouter);

app.listen(PORT, () => {
    console.log("Listening on 3000");
})