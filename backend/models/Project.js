const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  blockchainId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  ipfsHash: { type: String, required: true },
  fundingGoal: { type: Number, required: true },
  currentFunding: { type: Number, default: 0 },
  votesFor: { type: Number, default: 0 },
  votesAgainst: { type: Number, default: 0 },
  deadline: { type: Number, required: true },
  proposer: { type: String, required: true }, // Wallet address
  status: { 
    type: String, 
    enum: ['proposed', 'active', 'funded', 'rejected', 'completed'],
    default: 'proposed'
  },
  documents: [{
    ipfsHash: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now }
  }],
  milestones: [{
    title: String,
    targetFunding: Number,
    completed: { type: Boolean, default: false },
    completedAt: Date
  }],
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);