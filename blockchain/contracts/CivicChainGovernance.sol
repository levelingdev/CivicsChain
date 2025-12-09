// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CivicChainGovernance {
    
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        string ipfsHash;
        uint256 fundingGoal;
        uint256 voteCountFor;
        uint256 voteCountAgainst;
        uint256 deadline;
        bool executed;
        mapping(address => bool) voters;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    IERC20 public governanceToken;

    event ProposalCreated(uint256 id, string title, address proposer);
    event Voted(uint256 proposalId, address voter, bool support);
    event ProposalExecuted(uint256 id, bool funded);

    constructor(address _tokenAddress) {
        governanceToken = IERC20(_tokenAddress);
    }

    function createProject(
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        uint256 _fundingGoal,
        uint256 _duration
    ) public {
        proposalCount++;
        Proposal storage p = proposals[proposalCount];
        p.id = proposalCount;
        p.proposer = msg.sender;
        p.title = _title;
        p.description = _description;
        p.ipfsHash = _ipfsHash;
        p.fundingGoal = _fundingGoal;
        p.deadline = block.timestamp + _duration;
        p.executed = false;

        emit ProposalCreated(proposalCount, _title, msg.sender);
    }

    function vote(uint256 _proposalId, bool _support) public {
        Proposal storage p = proposals[_proposalId];
        require(block.timestamp < p.deadline, "Voting ended");
        require(!p.voters[msg.sender], "Already voted");
        require(!p.executed, "Already executed");

        uint256 balance = governanceToken.balanceOf(msg.sender);
        require(balance > 0, "No voting power");

        p.voters[msg.sender] = true;

        if (_support) {
            p.voteCountFor += 1; // Count USERS, not Tokens (1 Person = 1 Vote)
        } else {
            p.voteCountAgainst += 1;
        }

        emit Voted(_proposalId, msg.sender, _support);

        // ✅ LOGIC: AUTO-EXECUTE IF 6 USERS APPROVE
        if (p.voteCountFor >= 6) {
            p.executed = true;
            emit ProposalExecuted(_proposalId, true);
            // In a real DAO, we would transfer tokens here:
            // governanceToken.transfer(p.proposer, p.fundingGoal);
        }
    }
}