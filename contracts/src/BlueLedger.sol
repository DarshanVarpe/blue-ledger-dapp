// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title BlueLedger
 * @author Your Name
 * @notice A comprehensive smart contract for a Blue Carbon Registry.
 * It handles project registration, MRV data submission, verification by an admin (NCCR),
 * and minting of ERC1155 tokens as tokenized carbon credits.
 */
contract BlueLedger is ERC1155, Ownable {
    // --- STATE VARIABLES ---

    // Roles and Permissions
    mapping(address => bool) public isNgo;

    // Project Data Structures
    enum ProjectStatus { PENDING, AWAITING_VERIFICATION, VERIFIED, REJECTED }

    struct Project {
        uint256 id;
        string name;
        string location;
        string metadataHash; // IPFS hash for description and other files
        address owner; // The NGO's wallet address
        ProjectStatus status;
        uint256 lastSubmittedAt;
        uint256 carbonSequestered;
        uint256 creditsMinted;         // NEW: Stores minted credits amount
        string rejectionReason;        // NEW: Stores reason for rejection
        uint256 registrationTimestamp; // NEW: Timestamp for timeline
        uint256 decisionTimestamp;     // NEW: Timestamp for timeline
    }

    struct MRVData {
        uint256 id;
        uint256 projectId;
        string dataHash; // IPFS hash for MRV data (drone footage, sensor data)
        uint256 timestamp;
        address submitter;
    }

    // Counters
    uint256 private _projectCounter;
    uint256 private _mrvDataCounter;

    // Mappings
    mapping(uint256 => Project) public projects;
    mapping(uint256 => MRVData[]) public projectMRVData;

    // --- EVENTS ---
    event NgoAdded(address indexed ngoAddress);
    event NgoRemoved(address indexed ngoAddress);
    event ProjectRegistered(uint256 indexed projectId, address indexed owner, string name);
    event MRVDataSubmitted(uint256 indexed projectId, uint256 mrvId, string dataHash);
    event ProjectVerified(uint256 indexed projectId, uint256 creditsMinted);
    event ProjectRejected(uint256 indexed projectId, string reason);

    // --- MODIFIERS ---
    modifier onlyAdmin() {
        require(owner() == _msgSender(), "Caller is not the admin");
        _;
    }

    modifier onlyNgo() {
        require(isNgo[_msgSender()], "Caller is not an approved NGO");
        _;
    }

    // --- CONSTRUCTOR ---
    constructor()
        ERC1155("https://blueledger.app/api/token/{id}.json")
        Ownable(_msgSender())
    {}

    // --- NGO MANAGEMENT (Admin Only) ---
    function addNgo(address _ngoAddress) public onlyAdmin {
        require(_ngoAddress != address(0), "Invalid address");
        isNgo[_ngoAddress] = true;
        emit NgoAdded(_ngoAddress);
    }

    function removeNgo(address _ngoAddress) public onlyAdmin {
        isNgo[_ngoAddress] = false;
        emit NgoRemoved(_ngoAddress);
    }

    // --- PROJECT REGISTRATION & DATA SUBMISSION (NGO Only) ---
    function registerProject(
        string memory _name,
        string memory _location,
        string memory _metadataHash
    ) public onlyNgo {
        _projectCounter++;
        uint256 newProjectId = _projectCounter;

        projects[newProjectId] = Project({
            id: newProjectId,
            name: _name,
            location: _location,
            metadataHash: _metadataHash,
            owner: _msgSender(),
            status: ProjectStatus.PENDING,
            lastSubmittedAt: 0,
            carbonSequestered: 0,
            creditsMinted: 0,
            rejectionReason: "",
            registrationTimestamp: block.timestamp,
            decisionTimestamp: 0
        });

        emit ProjectRegistered(newProjectId, _msgSender(), _name);
    }

    function submitMRVData(uint256 _projectId, string memory _dataHash) public onlyNgo {
        Project storage project = projects[_projectId];
        require(project.id != 0, "Project does not exist");
        require(project.owner == _msgSender(), "You are not the owner of this project");

        _mrvDataCounter++;
        projectMRVData[_projectId].push(MRVData({
            id: _mrvDataCounter,
            projectId: _projectId,
            dataHash: _dataHash,
            timestamp: block.timestamp,
            submitter: _msgSender()
        }));

        project.status = ProjectStatus.AWAITING_VERIFICATION;
        project.lastSubmittedAt = block.timestamp;
        
        emit MRVDataSubmitted(_projectId, _mrvDataCounter, _dataHash);
    }

    // --- VERIFICATION (Admin Only) ---
    function verifyAndMintCredits(
        uint256 _projectId, 
        uint256 _creditsToMint, 
        uint256 _carbonAmount
    ) public onlyAdmin {
        Project storage project = projects[_projectId];
        require(project.id != 0, "Project does not exist");
        require(project.status == ProjectStatus.AWAITING_VERIFICATION, "Project not ready for verification");

        project.status = ProjectStatus.VERIFIED;
        project.carbonSequestered = _carbonAmount;
        project.creditsMinted = _creditsToMint;
        project.decisionTimestamp = block.timestamp;
        
        if (_creditsToMint > 0) {
            _mint(project.owner, _projectId, _creditsToMint, "");
        }

        emit ProjectVerified(_projectId, _creditsToMint);
    }

    function rejectProject(uint256 _projectId, string memory _reason) public onlyAdmin {
        Project storage project = projects[_projectId];
        require(project.id != 0, "Project does not exist");

        project.status = ProjectStatus.REJECTED;
        project.rejectionReason = _reason;
        project.decisionTimestamp = block.timestamp;
        emit ProjectRejected(_projectId, _reason);
    }

    // --- VIEW FUNCTIONS ---
    function uri(uint256 _tokenId) public view override returns (string memory) {
        require(projects[_tokenId].id != 0, "ERC1155Metadata: URI query for nonexistent token");
        return super.uri(_tokenId);
    }

    function getMRVDataForProject(uint256 _projectId) public view returns (MRVData[] memory) {
        return projectMRVData[_projectId];
    }
    
    function getAllProjects() public view returns (Project[] memory) {
        uint256 projectCount = _projectCounter;
        Project[] memory allProjects = new Project[](projectCount);
        for (uint256 i = 0; i < projectCount; i++) {
            allProjects[i] = projects[i + 1];
        }
        return allProjects;
    }
     // ✅ ADDED: New helper function to easily check a project's status
    function getProjectStatus(uint256 _projectId) public view returns (ProjectStatus) {
        require(projects[_projectId].id != 0, "Project does not exist");
        return projects[_projectId].status;
    }
}