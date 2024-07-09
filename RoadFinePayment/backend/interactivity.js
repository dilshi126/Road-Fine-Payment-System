const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const pool = new Pool({ /* Database config */ });
const twilio = require('twilio');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Hardcoded admin credentials
const adminCredentials = {
  username: 'admin',
  password: '123' // Use a strong password in a real scenario
};

app.use(bodyParser.json());

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminCredentials.username && password === adminCredentials.password) {
    const token = jwt.sign({ username: adminCredentials.username }, process.env.ADMIN_ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Admin add officer
app.post('/api/admin/addOfficer', authenticateAdminToken, (req, res) => {
  const { officerID, policeID, name } = req.body;
  pool.query('INSERT INTO officers (officerID, policeID, name) VALUES ($1, $2, $3)', [officerID, policeID, name], (error, results) => {
    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(201).json({ message: 'Officer added successfully' });
    }
  });
});

// Police officer login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  pool.query('SELECT * FROM officers WHERE username = $1', [username], (error, results) => {
    if (error || results.rows.length === 0 || results.rows[0].password !== password) {
      res.status(401).json({ message: 'Invalid credentials' });
    } else {
      const token = jwt.sign({ username: results.rows[0].username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.json({ token });
    }
  });
});

// Police officer create account
app.post('/api/createAccount', (req, res) => {
  const { officerID, policeID, username, password } = req.body;
  pool.query('SELECT * FROM officers WHERE officerID = $1 AND policeID = $2', [officerID, policeID], (error, results) => {
    if (error || results.rows.length === 0) {
      res.status(401).json({ message: 'Officer not authorized to create an account' });
    } else {
      pool.query('INSERT INTO officers (officerID, policeID, username, password) VALUES ($1, $2, $3, $4)', [officerID, policeID, username, password], (insertError) => {
        if (insertError) {
          res.status(500).json({ error: insertError.message });
        } else {
          res.status(201).json({ message: 'Account created successfully' });
        }
      });
    }
  });
});

// Add fine
app.post('/api/fines', authenticateToken, (req, res) => {
  const { licenseNumber, mobileNumber, fineAmount } = req.body;
  pool.query('INSERT INTO fines (licenseNumber, mobileNumber, fineAmount, status) VALUES ($1, $2, $3, $4)', [licenseNumber, mobileNumber, fineAmount, 'unpaid'], (error) => {
    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      sendSms(mobileNumber, `You have a new fine of amount ${fineAmount}. Pay here: <link>`);
      res.status(201).json({ message: 'Fine added and SMS sent' });
    }
  });
});

// Get fine by ID number
app.get('/api/fines/:licenseNumber', (req, res) => {
  const { licenseNumber } = req.params;
  pool.query('SELECT * FROM fines WHERE licenseNumber = $1 AND status = $2', [licenseNumber, 'unpaid'], (error, results) => {
    if (error || results.rows.length === 0) {
      res.status(404).json({ message: 'No unpaid fines found' });
    } else {
      res.json(results.rows[0]);
    }
  });
});

// Payment callback
app.post('/api/payments', (req, res) => {
  const { fineId, amountPaid } = req.body;
  pool.query('UPDATE fines SET status = $1 WHERE id = $2', ['paid', fineId], (error) => {
    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      pool.query('SELECT * FROM fines WHERE id = $1', [fineId], (fineError, results) => {
        if (fineError || results.rows.length === 0) {
          res.status(404).json({ message: 'Fine not found' });
        } else {
          const { mobileNumber } = results.rows[0];
          sendSms(mobileNumber, 'Your fine has been paid. Thank you!');
          res.json({ message: 'Payment successful and notification sent' });
        }
      });
    }
  });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function authenticateAdminToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ADMIN_ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function sendSms(to, message) {
  const client = new twilio(accountSid, authToken);
  client.messages.create({
    body: message,
    from: 'YOUR_TWILIO_NUMBER',
    to: to
  }).then(message => console.log(message.sid));
}

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
