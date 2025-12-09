// 1. Fix DNS for Atlas SRV
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
console.log("🌍 DNS servers updated");

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// 2. CORS Setup
app.use(cors({
  origin: ['http://localhost:3000', 'https://civicchain.cloud'],
  credentials: true
}));

// 3. Large body request (For JSON data)
app.use(express.json({ limit: '3000mb' }));
app.use(express.urlencoded({ limit: '3000mb', extended: true }));

// ✅ 4. AUTO-CREATE TEMP FOLDER (Critical Fix)
// This prevents "ENOENT" errors if the folder is missing
const tempDir = path.join(__dirname, 'uploads_temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
    console.log("📂 Created missing 'uploads_temp' directory");
}

// 5. Database (LOCAL MongoDB)
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000
})
.then(() => console.log("✅ Connected to Local MongoDB"))
.catch(err => console.error("❌ MongoDB Connect Error:", err));

// 6. Routes
// NOTE: Your admin routes are inside 'cloud.js', which is mounted at /api/auth
// So the frontend will call /api/auth/admin/stats (Matches your frontend code)
app.use('/api/auth', require('./routes/cloud'));
app.use('/api/projects', require('./routes/projects'));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server LIVE at http://localhost:${PORT}`);
});

// 7. Long Timeout (1 Hour)
server.setTimeout(60 * 60 * 1000);