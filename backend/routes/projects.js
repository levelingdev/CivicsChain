const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const Project = require('../models/Project');
const { authenticateToken } = require('../middleware/auth'); 

const upload = multer({ 
  storage: multer.diskStorage({
    destination: 'uploads_temp/',
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  limits: { fileSize: 4000 * 1024 * 1024 } // 4GB Limit
});

const PROTO_PATH = path.resolve(__dirname, '..', '..', 'cloud', 'cloud.proto');
const protoLoader = require('@grpc/proto-loader');
const grpc = require('@grpc/grpc-js');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const cloudProto = grpc.loadPackageDefinition(packageDefinition).cloud;

// Client Limit (Keep < 2GB for Windows, streaming bypasses this)
const MAX_SIZE = 2 * 1024 * 1024 * 1024 - 1000; 
const cloudClient = new cloudProto.CivicCloudService(
  process.env.CLOUD_GRPC_ENDPOINT || '127.0.0.1:9002',
  grpc.credentials.createInsecure(),
  { 'grpc.max_receive_message_length': MAX_SIZE, 'grpc.max_send_message_length': MAX_SIZE }
);

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:ipfsHash/view', (req, res) => {
  cloudClient.GetProjectDocument({ token: "public", ipfs_hash: req.params.ipfsHash }, (err, response) => {
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

// ✅ CREATE PROJECT (STREAMING)
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  req.setTimeout(0);
  try {
    if (!req.file || !req.body.title) return res.status(400).json({ error: 'Missing Data' });
    
    console.log(`📤 Streaming ${req.file.size} bytes to Cloud...`);

    // 1. Setup gRPC Stream
    const call = cloudClient.StoreProjectDocument((err, response) => {
        if (err) console.error("Cloud Error:", err);
    });

    const cloudUpload = new Promise((resolve, reject) => {
        call.on('data', (response) => resolve(response));
        call.on('error', (err) => reject(err));
        call.on('end', () => {});
    });

    // 2. Pipe File from Disk
    const readStream = fs.createReadStream(req.file.path, { highWaterMark: 4 * 1024 * 1024 }); // 4MB chunks
    
    for await (const chunk of readStream) {
        call.write({
            token: req.user.cloudToken,
            project_id: "new",
            filename: req.file.originalname,
            proposer_wallet: req.body.proposer,
            data: chunk
        });
    }
    call.end();

    const cloudResponse = await cloudUpload;
    console.log("✅ Upload Success:", cloudResponse.ipfs_hash);

    fs.unlinkSync(req.file.path);

    const project = new Project({
      blockchainId: Date.now(), title: req.body.title, description: req.body.description,
      ipfsHash: cloudResponse.ipfs_hash, fundingGoal: req.body.fundingGoal, proposer: req.body.proposer,
      deadline: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), status: 'proposed', deletionRequested: false
    });

    const savedProject = await project.save();
    res.status(201).json(savedProject);
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/request-delete', authenticateToken, async (req, res) => {
  const project = await Project.findById(req.params.id);
  project.deletionRequested = true;
  await project.save();
  res.json({ message: "Requested" });
});

router.delete('/:id', authenticateToken, async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;