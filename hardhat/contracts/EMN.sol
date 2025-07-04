// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract EMN is 
    Initializable, 
    ERC721Upgradeable, 
    ERC2981Upgradeable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable 
{
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EDITOR_ROLE = keccak256("EDITOR_ROLE");

    uint256 private s_tokenCounter;
    
    // Mapping from token ID to token URI
    mapping(uint256 => string) private s_tokenURIs;
    
    // Contract URI for contract-level metadata
    string private s_contractURI;

    event NftMinted(uint256 indexed tokenId, string tokenURI);
    event ContractURIUpdated(string newContractURI);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator,
        address admin,
        address editor
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC2981_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        s_tokenCounter = 0;
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(EDITOR_ROLE, editor);
        
        // Set role admin relationships
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(EDITOR_ROLE, ADMIN_ROLE);
        
        // Set default royalty for all tokens
        _setDefaultRoyalty(royaltyReceiver, royaltyFeeNumerator);
        
        // Set initial contract URI
        string memory json = '{"name": "EON MUN","description":"Each EMN NFT represenets a unique physical artwork created by EON MUN."}';
        s_contractURI = string.concat("data:application/json;utf8,", json);
    }

    function contractURI() external view returns (string memory) {
        return s_contractURI;
    }

    function setContractURI(string memory newContractURI) public onlyRole(EDITOR_ROLE) {
        s_contractURI = newContractURI;
        emit ContractURIUpdated(newContractURI);
    }

    function mintNft(string memory tokenURI) public onlyRole(EDITOR_ROLE) {
        uint256 tokenId = s_tokenCounter;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        emit NftMinted(tokenId, tokenURI);
        s_tokenCounter = s_tokenCounter + 1;
    }

    function mintNftTo(address to, string memory tokenURI) public onlyRole(EDITOR_ROLE) {
        uint256 tokenId = s_tokenCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        emit NftMinted(tokenId, tokenURI);
        s_tokenCounter = s_tokenCounter + 1;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return s_tokenURIs[tokenId];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    // Internal function to set token URI
    function _setTokenURI(uint256 tokenId, string memory tokenURI) internal {
        s_tokenURIs[tokenId] = tokenURI;
    }

    // Function to update token URI (only editor)
    function setTokenURI(uint256 tokenId, string memory tokenURI) public onlyRole(EDITOR_ROLE) {
        _requireOwned(tokenId);
        _setTokenURI(tokenId, tokenURI);
    }

    // Royalty management functions
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) public onlyRole(EDITOR_ROLE) {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) public onlyRole(EDITOR_ROLE) {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function deleteDefaultRoyalty() public onlyRole(EDITOR_ROLE) {
        _deleteDefaultRoyalty();
    }

    function resetTokenRoyalty(uint256 tokenId) public onlyRole(EDITOR_ROLE) {
        _resetTokenRoyalty(tokenId);
    }

    // Override supportsInterface to include AccessControl and ERC2981
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Upgradeable, ERC2981Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // UUPS upgrade authorization - only admin can upgrade
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}

    // Version function for upgrade tracking
    function version() public pure returns (string memory) {
        return "1.1.0";
    }
}
