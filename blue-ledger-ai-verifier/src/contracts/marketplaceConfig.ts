// This file contains the address and ABI for your BlueLedgerMarketplace contract.

export const marketplaceAddress = '0xdde2Fd0647231Cf96Ec2fF8f0Fc6D2F9643e7bA3' as const;

export const marketplaceAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_blueLedgerAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_paymentTokenAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "activeListingIdForProject",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "blueLedgerContract",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IERC1155"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "buyCredits",
    "inputs": [
      {
        "name": "_listingId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_quantityToBuy",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "listings",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "listingId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "projectId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "seller",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "quantity",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "pricePerUnit",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "active",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "onERC1155BatchReceived",
    "inputs": [
      { "name": "", "type": "address", "internalType": "address" },
      { "name": "", "type": "address", "internalType": "address" },
      { "name": "", "type": "uint256[]", "internalType": "uint256[]" },
      { "name": "", "type": "uint256[]", "internalType": "uint256[]" },
      { "name": "", "type": "bytes", "internalType": "bytes" }
    ],
    "outputs": [{ "name": "", "type": "bytes4", "internalType": "bytes4" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "onERC1155Received",
    "inputs": [
      { "name": "", "type": "address", "internalType": "address" },
      { "name": "from", "type": "address", "internalType": "address" },
      { "name": "id", "type": "uint256", "internalType": "uint256" },
      { "name": "value", "type": "uint256", "internalType": "uint256" },
      { "name": "data", "type": "bytes", "internalType": "bytes" }
    ],
    "outputs": [{ "name": "", "type": "bytes4", "internalType": "bytes4" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "paymentToken",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IERC20"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "platformFeePercentage",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "supportsInterface",
    "inputs": [
      {
        "name": "interfaceId",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "unlistCredits",
    "inputs": [
      {
        "name": "_listingId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "CreditsListed",
    "inputs": [
      { "name": "listingId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "projectId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "seller", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "quantity", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "pricePerUnit", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CreditsSold",
    "inputs": [
      { "name": "listingId", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "projectId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "seller", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "buyer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "quantity", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "totalPrice", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ListingCancelled",
    "inputs": [
      { "name": "listingId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "projectId", "type": "uint256", "indexed": true, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      { "name": "previousOwner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "newOwner", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [{ "name": "owner", "type": "address", "internalType": "address" }]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [{ "name": "account", "type": "address", "internalType": "address" }]
  },
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  }
] as const;