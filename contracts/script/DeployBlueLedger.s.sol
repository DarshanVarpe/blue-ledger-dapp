// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BlueLedger.sol";

contract DeployBlueLedger is Script {
    function run() external returns (BlueLedger) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // ✅ FIX: Removed the unused 'uri' variable

        vm.startBroadcast(deployerPrivateKey);

        // ✅ FIX: Call the constructor with zero arguments to match your contract
        BlueLedger blueLedger = new BlueLedger();

        vm.stopBroadcast();

        console.log("BlueLedger contract deployed to:", address(blueLedger));

        return blueLedger;
    }
}