// 1. Copy the Address from your deploy terminal
const GOVERNANCE_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // <--- PASTE NEW ADDRESS HERE
const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";      // <--- PASTE NEW TOKEN ADDRESS HERE

// 2. The Updated ABI
const GOVERNANCE_ABI = [
  "function proposalCount() view returns (uint256)",
  "function proposals(uint256) view returns (uint256 id, address proposer, string title, string description, string ipfsHash, uint256 fundingGoal, uint256 voteCountFor, uint256 voteCountAgainst, uint256 deadline, bool executed)",
  
  // ✅ This is the line that fixes your error:
  "function createProject(string _title, string _description, string _ipfsHash, uint256 _fundingGoal, uint256 _duration) public",
  
  "function vote(uint256 _proposalId, bool _support) public",
  "event ProposalCreated(uint256 id, string title, address proposer)",
  "event Voted(uint256 proposalId, address voter, bool support)"
];

const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint amount)"
];

export const CONTRACTS = {
  GOVERNANCE: {
    address: GOVERNANCE_ADDRESS,
    abi: GOVERNANCE_ABI
  },
  TOKEN: {
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI
  }
};