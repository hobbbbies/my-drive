// app.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');

const indexRouter = require("./routes/indexRouter");
const fileRouter = require("./routes/fileRouter");
const authRouter = require("./routes/authRouter");
const folderRouter = require("./routes/folderRouter");

const { log } = require("console");
const {createClient} = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY); 
const session = require("express-session");
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg')

require('dotenv').config();
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const pgPool = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL, // Your Supabase PostgreSQL URL
  ssl: {
    rejectUnauthorized: false // Supabase requires this
  }
});

app.use(session({
  store: new pgSession({
    pool: pgPool,
  }),
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000, // 1 hour
  }
}));

app.use("/", indexRouter);
app.use("/upload", fileRouter);
app.use("/auth", authRouter);
app.use("/folder", folderRouter);

app.listen(PORT, () => {
    console.log("Listening on 3000");
})