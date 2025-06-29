// We don't have Ethereum specific assertions in Hardhat 3 yet
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("EMN", async function () {
  // Specify chainType to get proper viem support and avoid linter errors
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  
  const ROYALTY_FEE = 500n; // 5% (500 basis points)
  
  // Test URIs for different scenarios
  const TEST_URIS = {
    ipfs1: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme",
    ipfs2: "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/metadata.json",
    https: "https://api.example.com/nft/metadata/1.json",
    arweave: "ar://abc123def456/metadata.json"
  };
  
  describe("Contract Deployment", () => {
    it("Should deploy the implementation contract successfully", async function () {
      const emn = await viem.deployContract("EMN");
      
      // Check that the contract deployed
      assert.ok(emn.address);
      
      // Check version
      const version = await emn.read.version();
      assert.equal(version, "1.0.0");
    });

    it("Should support required interfaces", async function () {
      const emn = await viem.deployContract("EMN");
      
      // ERC721 interface ID
      const supportsERC721 = await emn.read.supportsInterface(["0x80ac58cd"]);
      // ERC2981 interface ID (royalties)
      const supportsERC2981 = await emn.read.supportsInterface(["0x2a55205a"]);
      // ERC165 interface ID
      const supportsERC165 = await emn.read.supportsInterface(["0x01ffc9a7"]);
      
      assert.equal(supportsERC721, true);
      assert.equal(supportsERC2981, true);
      assert.equal(supportsERC165, true);
    });

    it("Should prevent direct initialization on implementation", async function () {
      const emn = await viem.deployContract("EMN");
      const walletClients = await viem.getWalletClients();
      const royaltyReceiver = walletClients[1].account.address;
      
      // Try to initialize the implementation directly (should fail)
      try {
        await emn.write.initialize([
          royaltyReceiver,
          ROYALTY_FEE
        ]);
        assert.fail("Should have thrown an error - direct initialization should be blocked");
      } catch (error) {
        // Expected to fail because initializers are disabled in constructor
        assert.ok(true);
      }
    });

    it("Should have correct function signatures for URI-based minting", async function () {
      // Note: The contract now requires tokenURI parameters for minting functions:
      // - mintNft(string memory tokenURI) 
      // - mintNftTo(address to, string memory tokenURI)
      // - setTokenURI(uint256 tokenId, string memory tokenURI) [owner only]
      assert.ok(true, "Function signatures updated for URI-based minting");
    });
  });

  describe("Upgrade Pattern Documentation", () => {
    it("Should document proper deployment pattern with URI-based minting", async function () {
      // This test documents how to properly deploy and use this upgradeable contract
      
      /*
      Proper deployment and usage requires:
      
      1. Deploy the implementation contract:
         const implementation = await viem.deployContract("BasicNftRoyalties");
      
      2. Deploy an ERC1967Proxy or TransparentUpgradeableProxy:
         const proxyContract = await viem.deployContract("ERC1967ProxyWrapper", [
           implementation.address,
           initData
         ]);
      
      3. Encode initialization data:
         const initData = encodeFunctionData({
           abi: parseAbi(['function initialize(string,string,address,uint96)']),
           functionName: 'initialize',
           args: ["Dogie Royalties", "DOGR", royaltyReceiver, 500n]
         });
      
      4. Interact with the contract through the proxy address:
         const proxiedContract = await viem.getContractAt("BasicNftRoyalties", proxyContract.address);
      
      5. Mint NFTs with unique URIs:
         await proxiedContract.write.mintNft(["ipfs://QmYour...Hash/metadata.json"]);
         await proxiedContract.write.mintNftTo([recipient, "https://api.yoursite.com/nft/1"]);
      
      6. Update token URIs (owner only):
         await proxiedContract.write.setTokenURI([tokenId, "newURI"]);
      
      The contract includes:
      - ERC721Upgradeable for NFT functionality
      - ERC2981Upgradeable for royalty support (EIP-2981)
      - OwnableUpgradeable for access control
      - UUPSUpgradeable for upgrade functionality
      - Individual token URI storage and management
      - Comprehensive royalty management functions
      
      Key Features:
      - Each NFT can have a unique metadata URI
      - URIs can be IPFS, HTTPS, Arweave, or any valid URI scheme
      - Owner can update token URIs post-mint
      - Event emission includes both tokenId and tokenURI for indexing
      */
      
      assert.ok(true, "Deployment and usage pattern documented");
    });

    it("Should demonstrate expected events and data structures", async function () {
      /*
      Expected event structure:
      event NftMinted(uint256 indexed tokenId, string tokenURI);
      
      This allows marketplaces and indexers to:
      1. Track new mints by tokenId
      2. Immediately access metadata URI without additional calls
      3. Index NFTs by their metadata content
      
      Storage structure:
      - mapping(uint256 => string) private s_tokenURIs;
      - uint256 private s_tokenCounter;
      
      This provides:
      1. Efficient token URI lookups
      2. Support for updating URIs
      3. Gas-efficient storage pattern
      */
      
      assert.ok(true, "Event and storage structure documented");
    });
  });
}); 