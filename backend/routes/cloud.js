const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const router = express.Router();

const PROTO_PATH = path.resolve(__dirname, '..', '..', 'cloud', 'cloud.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const cloudProto = grpc.loadPackageDefinition(packageDefinition).cloud;

const cloudClient = new cloudProto.CivicCloudService(
  process.env.CLOUD_GRPC_ENDPOINT || '127.0.0.1:9002',
  grpc.credentials.createInsecure()
);

// --- AUTH ROUTES ---
router.post('/register-init', (req, res) => {
  cloudClient.RegisterInit(req.body, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: response.result });
  });
});

router.post('/register-verify', (req, res) => {
  cloudClient.RegisterVerify(req.body, (err, response) => {
    if (err) return res.status(400).json({ error: "Invalid OTP" });
    res.json({ message: response.result });
  });
});

router.post('/login', (req, res) => {
  cloudClient.Login(req.body, (err, response) => {
    if (err) return res.status(500).json({ error: "Cloud Unavailable" });
    if (response.result && response.result.includes('OTP')) {
      res.json({ message: response.result, stage: 'otp' });
    } else {
      res.status(401).json({ error: response.result || "Login failed" });
    }
  });
});

router.post('/verify-otp', (req, res) => {
  cloudClient.VerifyOTP(req.body, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    if (response.token) {
      const jwtToken = require('jsonwebtoken').sign(
        { cloudToken: response.token, userId: response.user_id },
        process.env.JWT_SECRET || 'civicchain_secret',
        { expiresIn: '24h' }
      );
      res.json({ token: jwtToken, user: { login: req.body.login } });
    } else {
      res.status(401).json({ error: 'Invalid OTP' });
    }
  });
});

// --- ADMIN ROUTES ---
router.get('/admin/stats', (req, res) => {
  cloudClient.GetAdminStats({ admin_token: "internal" }, (err, response) => {
    if (err) return res.status(500).json({ error: "Failed to fetch stats" });
    res.json(response);
  });
});

router.post('/admin/node', (req, res) => {
  const { nodeId, action } = req.body; // action: "START" or "STOP"
  cloudClient.ToggleNode({ node_id: nodeId, action }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: response.result });
  });
});

// --- DYNAMIC NODE ROUTES (NEW) ---
router.post('/admin/node/add', (req, res) => {
  cloudClient.AddNode({ admin_token: "internal" }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: response.result });
  });
});

router.delete('/admin/node/:id', (req, res) => {
  cloudClient.RemoveNode({ node_id: req.params.id }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: response.result });
  });
});

router.get('/admin/node/:id/files', (req, res) => {
  cloudClient.GetNodeFiles({ node_id: req.params.id }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response);
  });
});

module.exports = router;