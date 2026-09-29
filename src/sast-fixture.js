// sast-fixture.js
// Intentionally vulnerable code for Semgrep testing only.
// Do not use this in production.

const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
app.use(express.json());

// 1. Hardcoded secret
const API_KEY = "sk_test_1234567890abcdef";

// 2. Command injection
app.get("/ping", (req, res) => {
  const host = req.query.host;

  exec("ping -c 1 " + host, (error, stdout) => {
    if (error) {
      return res.status(500).send(error.message);
    }

    res.send(stdout);
  });
});

// 3. Path traversal / arbitrary file read
app.get("/file", (req, res) => {
  const filename = req.query.filename;

  fs.readFile("/tmp/" + filename, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    res.send(data);
  });
});

// 4. eval() on user-controlled input
app.post("/calculate", (req, res) => {
  const expression = req.body.expression;

  const result = eval(expression);

  res.json({
    result: result
  });
});

// 5. XSS-style direct reflection
app.get("/hello", (req, res) => {
  const name = req.query.name;

  res.send("<html><body>Hello " + name + "</body></html>");
});

// 6. Weak cryptographic hash
const crypto = require("crypto");

app.get("/hash", (req, res) => {
  const input = req.query.input;

  const hash = crypto
    .createHash("md5")
    .update(input)
    .digest("hex");

  res.send(hash);
});

// 7. Insecure random token
app.get("/token", (req, res) => {
  const token = Math.random().toString(36);

  res.json({
    token: token
  });
});

// 8. Potential prototype pollution
app.post("/merge", (req, res) => {
  const target = {};
  const source = req.body;

  for (const key in source) {
    target[key] = source[key];
  }

  res.json(target);
});

app.listen(3000, "0.0.0.0", () => {
  console.log("SAST fixture running on port 3000");
});
