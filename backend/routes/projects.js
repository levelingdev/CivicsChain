const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const Project = require('../models/Project');
const { authenticateToken } = require('../middleware/auth'); 

// ✅ OPTIMIZATION: Use Disk Storage for large files
const upload = multer({ 
  storage: multer.diskStorage({
    destination: 'uploads_temp/', // Ensure this folder exists!
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  limits: { fileSize: 3000 * 1024 * 1024 } // 3GB
});

// gRPC Setup
const PROTO_PATH = path.resolve(__dirname, '..', '..', 'cloud', 'cloud.proto');
const protoLoader = require('@grpc/proto-loader');
const grpc = require('@grpc/grpc-js');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const cloudProto = grpc.loadPackageDefinition(packageDefinition).cloud;
const cloudClient = new cloudProto.CivicCloudService(
  process.env.CLOUD_GRPC_ENDPOINT || '127.0.0.1:9002',
  grpc.credentials.createInsecure(),
  { 'grpc.max_receive_message_length': 1024*1024*1024*3, 'grpc.max_send_message_length': 1024*1024*1024*3 }
);

// --- ROUTES ---
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:ipfsHash/view', (req, res) => {
  const { ipfsHash } = req.params;
  cloudClient.GetProjectDocument({ token: "public", ipfs_hash: ipfsHash }, (err, response) => {
    if (err || !response.data) return res.status(404).send("File not found");
    const filename = response.filename || "file.bin";
    let contentType = 'application/octet-stream';
    if (filename.endsWith('.pdf')) contentType = 'application/pdf';
    if (filename.endsWith('.mp4')) contentType = 'video/mp4';
    if (filename.endsWith('.png')) contentType = 'image/png';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(response.data);
  });
});

// ✅ CREATE PROJECT WITH DISK STREAMING
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  req.setTimeout(0); // Disable timeout for large uploads
  
  try {
    if (!req.file || !req.body.title) return res.status(400).json({ error: 'Missing Data' });
    
    // Read the file buffer from disk (Note: Node still has 2GB buffer limit, but this helps initial upload)
    const fileBuffer = fs.readFileSync(req.file.path);

    const cloudUpload = new Promise((resolve, reject) => {
      cloudClient.StoreProjectDocument({
        token: req.user.cloudToken,
        project_id: "new", 
        filename: req.file.originalname,
        data: fileBuffer, 
        proposer_wallet: req.body.proposer
      }, (err, response) => {
        if (err) reject(err); else resolve(response);
      });
    });

    const cloudResponse = await cloudUpload;

    // Cleanup: Delete temp file
    fs.unlinkSync(req.file.path);

    const project = new Project({
      blockchainId: Date.now(), 
      title: req.body.title,
      description: req.body.description,
      ipfsHash: cloudResponse.ipfs_hash, 
      fundingGoal: req.body.fundingGoal,
      proposer: req.body.proposer,
      deadline: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), 
      status: 'proposed',
      deletionRequested: false 
    });

    const savedProject = await project.save();
    res.status(201).json(savedProject);
  } catch (err) {
    // Cleanup on error too
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/request-delete', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    project.deletionRequested = true;
    await project.save();
    res.json({ message: "Deletion requested." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.userId !== 'admin') return res.status(403).json({ error: "Admins only" });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Project deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;