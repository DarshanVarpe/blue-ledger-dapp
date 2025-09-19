// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BlueLedgerMarketplace.sol"; // Import your marketplace contract

contract DeployBlueLedgerMarketplace is Script {
    function run() external returns (BlueLedgerMarketplace) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // --- IMPORTANT: Use your ACTUAL deployed addresses ---
        // 1. Your existing, working BlueLedger (ERC1155) contract address.
        // 2. The address of your NEWLY deployed MockERC20 contract.
        address existingBlueLedgerAddress = 0xd52872F6E43cA8D075b5fe6900c65041AEc1440D; // ✅ YOUR EXISTING BlueLedger address
        address newMockERC20Address = 0x769468A05FFde80b66959b73eEdA9bdac67E46E7; // ⚠️ REPLACE with YOUR NEW MockERC20 address

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the BlueLedgerMarketplace contract,
        // using your EXISTING BlueLedger and the NEW MockERC20.
        BlueLedgerMarketplace marketplace = new BlueLedgerMarketplace(existingBlueLedgerAddress, newMockERC20Address);

        vm.stopBroadcast();

        console.log("BlueLedgerMarketplace contract deployed to:", address(marketplace));
        console.log("Initialized with BlueLedger at:", existingBlueLedgerAddress);
        console.log("Initialized with MockERC20 at:", newMockERC20Address);

        return marketplace;
    }
}