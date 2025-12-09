Here is the full **`README.md`** file in English, structured exactly according to the headings you requested, including the complete installation guide with all dependencies.

-----

# CivicChain Cloud & Governance Platform

**A Decentralized Governance and Distributed Cloud Storage Platform**

-----

## 1\. Problem Statement

In current governance systems, voting transparency and data sovereignty are often questioned. Centralized cloud storage solutions (like Google Drive or AWS) pose risks of censorship, data loss, or privacy breaches, while traditional voting systems lack public traceability. Furthermore, storing large evidence files (videos, ISOs) directly on a Blockchain is technically impossible and prohibitively expensive. There is a lack of a hybrid solution connecting the trust of Blockchain with the performance of distributed Cloud storage.

## 2\. General Objective

To design and develop **CivicChain**, an integrated SaaS platform that combines a **Decentralized Storage Cloud (Python/gRPC)** for large files and a **Blockchain (Ethereum/Solidity)** for governance. The goal is to empower citizens to submit proposals, store censorship-resistant evidence, and vote transparently.

## 3\. Specific Objectives

  * **Decentralize Storage:** Create a network of virtual storage nodes in Python capable of sharding and distributing large files (up to 3GB).
  * **Ensure Transparency:** Use Smart Contracts to record proposals and votes, making any falsification impossible.
  * **Dynamic Network Management:** Provide an Administrator "Command Center" dashboard to add, remove, or inspect storage nodes in real-time.
  * **Optimize Performance:** Ensure direct streaming of files (Video/PDF) from the virtual disk to the browser without overloading server memory.
  * **Facilitate Participation:** Create an intuitive user interface for project submission and community voting.

## 4\. Project Description

CivicChain is a distributed application composed of three interconnected layers:

1.  **The Cloud Layer (Python):** A cluster manager that simulates a RAID-like file system. When a file is uploaded, it is sliced into **16MB chunks** and scattered across multiple virtual nodes.
2.  **The Blockchain Layer (Solidity):** Smart contracts manage the currency (`CivicToken`) and governance. A proposal is funded/executed only if it reaches the required quorum (e.g., 6 votes).
3.  **The Web Interface (React):**
      * **Citizen Portal:** To upload evidence, browse projects, and cast votes.
      * **Admin Portal:** A "Command Center" visualizing PIDs, disk usage, and allowing the boot/shutdown of nodes or approval of content deletion.

## 5\. Project Justification

This project addresses the growing need for **Web3** and **Liquid Democracy** solutions. It demonstrates how peer-to-peer technologies can solve concrete governance problems. Technically, it justifies the hybridization of technologies: Python for system processing power (sockets, processes), Node.js for API speed, and Blockchain for immutability. It serves as a solid proof-of-concept for national or organizational voting systems.

## 6\. Project Scope

  * **Target Audience:** Decentralized Autonomous Organizations (DAOs), local governments, or academic institutions.
  * **Included Features:**
      * 2FA Authentication (Email OTP).
      * Large File Management (ISOs, Videos 2.7GB+).
      * Token-Weighted Voting System.
      * Real-time System Administration.
  * **Current Limitations:** The system runs on a local network (Localhost/Hardhat) and simulates storage nodes on a single physical machine via isolated processes.

## 7\. Technical Architecture (Overview)

The system relies on a complex micro-services architecture:

  * **Frontend:** React.js, Ethers.js (Web3), Axios.
  * **Backend API:** Node.js, Express, Multer (DiskStorage streaming), Mongoose.
  * **Cloud Core:** Python 3.9, gRPC (Inter-process communication), Sockets (Data transfer), Psutil (Monitoring).
  * **Blockchain:** Hardhat (Local Network), Solidity 0.8.20 (OpenZeppelin Smart Contracts).
  * **Database:** MongoDB (Metadata and indexing).

## 8\. Methodology

1.  **Infrastructure Phase (Cloud):** Development of the gRPC communication protocol and virtual file system (VFAT Virtual Disk).
2.  **Blockchain Phase:** Writing and deploying `CivicToken` and `Governance` contracts.
3.  **API & Integration Phase:** Creating the Node.js bridge to link the Frontend to the Python Cloud via data streams.
4.  **Interface & UX Phase:** Development of the dynamic Admin Dashboard (add/remove nodes) and voting system.
5.  **Optimization:** Transition to DiskStorage and increasing chunk size (16MB) to support massive files.

## 9\. Expected Results

  * A functional platform capable of receiving, encrypting, and storing a 3GB file in seconds.
  * A voting system where transactions are verifiable on the local blockchain.
  * An administrator dashboard capable of "killing" a node process and seeing the system react.
  * A smooth user experience, from registration (OTP) to the final vote.

## 10\. Future Perspectives

  * **Physical Deployment:** Replace Python virtual nodes with actual Raspberry Pis connected over a real network.
  * **Mainnet:** Deploy contracts on Ethereum Mainnet or Polygon.
  * **Advanced Replication:** Implement RAID-5 type redundancy so a file is recoverable even if a node fails.
  * **AI Moderation:** Automatic analysis of uploaded videos to detect inappropriate content before voting.

-----

## 🛠️ Installation & Technical Configuration

Follow these steps exactly to run the project locally with all dependencies.

### Prerequisites (Software Needed)

  * **Node.js** (v16 or higher)
  * **Python** (v3.8 or higher)
  * **MongoDB Community Server** (Must be installed and running)
  * **MetaMask Extension** (Configured for Localhost:8545)
  * **Git**

### Step 1: Clone the Project

```bash
git clone https://github.com/your-username/civicchain-cloud.git
cd civicchain-cloud
```

### Step 2: Blockchain Setup

We use **Hardhat** for the local blockchain.

```bash
cd blockchain

# Install Dependencies
npm install hardhat @nomicfoundation/hardhat-toolbox dotenv @openzeppelin/contracts

# Terminal 1: Start the Local Blockchain (Keep this window open!)
npx hardhat node

# Terminal 2: Deploy Smart Contracts (Run this in a new terminal)
npx hardhat run contracts/scripts/deploy.js --network localhost
```

> **⚠️ Important:** Copy the `CivicToken` and `CivicChainGovernance` addresses output by the deploy script. You will need them for Step 5.

### Step 3: Cloud Python Setup

We use **gRPC** and **Psutil**.

```bash
cd ../cloud

# Install Python Dependencies
pip install grpcio grpcio-tools protobuf psutil python-dotenv bcrypt

# Generate gRPC Code (Run this once)
python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. cloud.proto

# Start the Cloud Manager
python cloud_civic.py
```

*You should see: "☁️ CivicChain Cloud LIVE on 9002"*

### Step 4: Backend Setup

We use **Express**, **Mongoose**, and **Multer**.

```bash
cd ../backend

# Install Backend Dependencies
npm install express mongoose cors dotenv multer @grpc/grpc-js @grpc/proto-loader jsonwebtoken bcrypt

# Create the temp folder for large uploads (Critical for large files)
mkdir uploads_temp

# Configure Environment
# Create a file named '.env' inside the backend folder and add:
# MONGODB_URI=mongodb://127.0.0.1:27017/civicchain
# JWT_SECRET=civicsecretkey
# CLOUD_GRPC_ENDPOINT=127.0.0.1:9002

# Start Server
npm start
```

*You should see: "🚀 Server LIVE at http://localhost:5000"*

### Step 5: Frontend Setup

We use **React**, **Ethers**, and **Axios**.

```bash
cd ../frontend

# Install React Dependencies
npm install ethers axios react-router-dom

# Update Contract Addresses
# Open 'src/utils/contracts.js' and paste the addresses you copied in Step 2.

# Start React App
npm start
```

*The app will open at `http://localhost:3000`. Login with `admin` / `password123` to access the Command Center.*