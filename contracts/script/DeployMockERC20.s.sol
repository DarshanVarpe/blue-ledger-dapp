// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockERC20.sol"; // Import your MockERC20 contract

contract DeployMockERC20 is Script {
    function run() external returns (MockERC20) {
        // Get the private key from your .env file
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting the transaction
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the MockERC20 contract
        MockERC20 mockERC20 = new MockERC20();

        // Stop broadcasting
        vm.stopBroadcast();

        // Log the deployed address for confirmation
        console.log("MockERC20 contract deployed to:", address(mockERC20));

        return mockERC20;
    }
}