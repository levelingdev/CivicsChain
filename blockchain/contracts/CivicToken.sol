// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // ✅ UPDATED VERSION

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CivicToken is ERC20, Ownable {
    constructor() ERC20("CivicChain Token", "CIVIC") Ownable(msg.sender) {
        // Mint 1 Million Tokens to the deployer (Admin)
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    // Function to give tokens to users (Faucet)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}