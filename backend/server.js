// 1. Fix DNS for Atlas SRV (still fine)
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
console.log("🌍 DNS servers updated");

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// 2. CORS Setup
app.use(cors({
  origin: ['http://localhost:3000', 'https://civicchain.cloud'],
  credentials: true
}));

// 3. Large body request
app.use(express.json({ limit: '3000mb' }));
app.use(express.urlencoded({ limit: '3000mb', extended: true }));

// 4. Database (LOCAL MongoDB)
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000
})
.then(() => console.log("✅ Connected to Local MongoDB"))
.catch(err => console.error("❌ MongoDB Connect Error:", err));

// 5. Routes
app.use('/api/auth', require('./routes/cloud'));
app.use('/api/projects', require('./routes/projects'));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server LIVE at http://localhost:${PORT}`);
});

// 6. Long Timeout
server.setTimeout(60 * 60 * 1000);
