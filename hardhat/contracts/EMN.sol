// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract EMN is 
    Initializable, 
    ERC721Upgradeable, 
    ERC2981Upgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable 
{
    uint256 private s_tokenCounter;
    
    // Mapping from token ID to token URI
    mapping(uint256 => string) private s_tokenURIs;

    event NftMinted(uint256 indexed tokenId, string tokenURI);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address royaltyReceiver,
        uint96 royaltyFeeNumerator
    ) public initializer {
        __ERC721_init("EON MUN Originals", "EMN");
        __ERC2981_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        
        s_tokenCounter = 0;
        
        // Set default royalty for all tokens
        _setDefaultRoyalty(royaltyReceiver, royaltyFeeNumerator);
    }

    function contractURI() external pure returns (string memory) {
        // return _contractURI;
        // or e.g. for onchain:
        string memory json = '{"name": "EON MUN","description":"Each EMN NFT represenets a unique physical artwork created by EON MUN."}';
        return string.concat("data:application/json;utf8,", json);
    }

    function mintNft(string memory tokenURI) public {
        uint256 tokenId = s_tokenCounter;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        emit NftMinted(tokenId, tokenURI);
        s_tokenCounter = s_tokenCounter + 1;
    }

    function mintNftTo(address to, string memory tokenURI) public onlyOwner {
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

    // Function to update token URI (only owner)
    function setTokenURI(uint256 tokenId, string memory tokenURI) public onlyOwner {
        _requireOwned(tokenId);
        _setTokenURI(tokenId, tokenURI);
    }

    // Royalty management functions
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) public onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) public onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function deleteDefaultRoyalty() public onlyOwner {
        _deleteDefaultRoyalty();
    }

    function resetTokenRoyalty(uint256 tokenId) public onlyOwner {
        _resetTokenRoyalty(tokenId);
    }

    // Override supportsInterface to include ERC2981
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Upgradeable, ERC2981Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // UUPS upgrade authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Version function for upgrade tracking
    function version() public pure returns (string memory) {
        return "1.0.0";
    }
}
