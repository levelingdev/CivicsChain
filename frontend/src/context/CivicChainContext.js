import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { apiService } from '../services/api';
import { CONTRACTS } from '../utils/contracts';

export const CivicChainContext = createContext();

// HARDHAT DEFAULT SETTINGS
const RPC_URL = "http://127.0.0.1:8545";
// The Admin Account (Account #0) used to send free ETH to new users
const ADMIN_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export const CivicChainProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Initialize with zeros so dashboard never shows blank
  const [stats, setStats] = useState({
    totalProposals: 0,
    activeVoters: 0,
    treasuryUSD: "0.00",
    treasuryTokens: 0,
    quorum: 0
  });

  // --- 1. HELPER: Fund the User (Faucet) ---
  const fundUser = async (userAddress, provider) => {
    try {
      const adminWallet = new ethers.Wallet(ADMIN_KEY, provider);
      const balance = await provider.getBalance(userAddress);
      
      // Only fund if they have less than 0.1 ETH
      if (balance < ethers.parseEther("0.1")) {
        console.log("💰 Faucet: Sending funds to new user...");
        
        // FIX: Manually get the latest nonce to prevent collisions
        const nonce = await provider.getTransactionCount(adminWallet.address, "latest");
        
        const tx = await adminWallet.sendTransaction({
          to: userAddress,
          value: ethers.parseEther("1.0"),
          nonce: nonce // Explicitly use the fresh nonce
        });
        
        await tx.wait();
        console.log("✅ User funded!");
      }
    } catch (err) {
      // FIX: Ignore "Nonce too low" errors silently (Parallel requests)
      if (err.message && (err.message.includes("Nonce too low") || err.code === "NONCE_EXPIRED")) {
        console.log("⚠️ Faucet collision handled (User is already funded).");
      } else {
        console.warn("Faucet skipped:", err.message);
      }
    }
  };

  // --- 2. LOAD DATA ---
  const loadRealData = useCallback(async (currentSigner) => {
    try {
      // 1. Get API Data (Proposals from MongoDB)
      const projects = await apiService.getProposals();
      setProposals(projects || []);

      // 2. Get Blockchain Data (Treasury Balance)
      let balance = "0";
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const tokenContract = new ethers.Contract(
          CONTRACTS.TOKEN.address, 
          CONTRACTS.TOKEN.abi, 
          provider
        );
        const rawBal = await tokenContract.balanceOf(CONTRACTS.GOVERNANCE.address);
        balance = ethers.formatEther(rawBal);
      } catch (e) {
        console.warn("Blockchain Read Error (Is Hardhat running?):", e.message);
      }

      // 3. Update Stats
      setStats({
        totalProposals: projects ? projects.length : 0,
        activeVoters: 12, // Mock active users
        treasuryUSD: (parseFloat(balance) * 0.05).toFixed(2), // Mock Exchange Rate ($0.05)
        treasuryTokens: Math.floor(parseFloat(balance)),
        quorum: 4
      });

    } catch (err) {
      console.error("Data Load Error:", err);
    }
  }, []);

  // --- 3. CONNECT WALLET (Auto-Burner) ---
  const connectWallet = async () => {
    setLoading(true);
    try {
      // Connect to Hardhat
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      
      // Check for existing key in LocalStorage (Persist Wallet ID)
      let privateKey = localStorage.getItem('civic_wallet_key');
      
      if (!privateKey) {
        // Create new random wallet
        const randomWallet = ethers.Wallet.createRandom();
        privateKey = randomWallet.privateKey;
        localStorage.setItem('civic_wallet_key', privateKey);
      }

      // Create Signer
      const userWallet = new ethers.Wallet(privateKey, provider);
      
      // Fund them automatically (if needed)
      await fundUser(userWallet.address, provider);

      setAccount(userWallet.address);
      setSigner(userWallet);
      
      // Load Data
      await loadRealData(userWallet);
      
    } catch (err) {
      console.error("Connection Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-connect on load
  useEffect(() => {
    connectWallet();
  }, []); // Runs once on mount

  // --- 4. VOTE FUNCTION ---
  const vote = async (blockchainId, support) => {
    if (!signer) return alert("System connecting... Please wait.");
    try {
      const gov = new ethers.Contract(CONTRACTS.GOVERNANCE.address, CONTRACTS.GOVERNANCE.abi, signer);
      
      console.log(`🗳️ Voting on Proposal ${blockchainId} with ${support ? "YES" : "NO"}...`);
      
      const tx = await gov.vote(blockchainId, support);
      await tx.wait();
      
      alert("✅ Vote Cast Successfully!");
      loadRealData(signer); // Refresh stats
    } catch (err) {
      console.error(err);
      alert("Voting Failed: " + (err.reason || err.message));
    }
  };

  return (
    <CivicChainContext.Provider value={{ 
      account, 
      signer, 
      connectWallet, 
      isConnected: !!account,
      proposals, 
      stats, 
      loading, 
      vote 
    }}>
      {children}
    </CivicChainContext.Provider>
  );
};