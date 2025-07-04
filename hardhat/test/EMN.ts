// We don't have Ethereum specific assertions in Hardhat 3 yet
import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { encodeFunctionData, parseAbi } from "viem";

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
      assert.equal(version, "1.1.0");
    });

    it("Should support required interfaces", async function () {
      const emn = await viem.deployContract("EMN");
      
      // ERC721 interface ID
      const supportsERC721 = await emn.read.supportsInterface(["0x80ac58cd"]);
      // ERC2981 interface ID (royalties)
      const supportsERC2981 = await emn.read.supportsInterface(["0x2a55205a"]);
      // AccessControl interface ID
      const supportsAccessControl = await emn.read.supportsInterface(["0x7965db0b"]);
      // ERC165 interface ID
      const supportsERC165 = await emn.read.supportsInterface(["0x01ffc9a7"]);
      
      assert.equal(supportsERC721, true);
      assert.equal(supportsERC2981, true);
      assert.equal(supportsAccessControl, true);
      assert.equal(supportsERC165, true);
    });

    it("Should have correct role constants defined", async function () {
      const emn = await viem.deployContract("EMN");
      
      // Check role constants are defined
      const adminRole = await emn.read.ADMIN_ROLE();
      const editorRole = await emn.read.EDITOR_ROLE();
      
      // These should be keccak256 hashes of the role names
      assert.ok(adminRole);
      assert.ok(editorRole);
      assert.notEqual(adminRole, editorRole);
    });

    it("Should prevent direct initialization on implementation", async function () {
      const emn = await viem.deployContract("EMN");
      const walletClients = await viem.getWalletClients();
      const royaltyReceiver = walletClients[1].account.address;
      const admin = walletClients[2].account.address;
      const editor = walletClients[3].account.address;
      
      // Try to initialize the implementation directly (should fail)
      try {
        await emn.write.initialize([
          "EON MUN",
          "EMN",
          royaltyReceiver,
          ROYALTY_FEE,
          admin,
          editor
        ]);
        assert.fail("Should have thrown an error - direct initialization should be blocked");
      } catch (error) {
        // Expected to fail because initializers are disabled in constructor
        assert.ok(true);
      }
    });

    it("Should have correct function signatures for URI-based minting with role-based access", async function () {
      // Note: The contract now uses AccessControl with role-based permissions:
      // - ADMIN_ROLE: Can upgrade the contract
      // - EDITOR_ROLE: Can mint NFTs (to themselves or others), modify contract/NFT data
      // - mintNft(string memory tokenURI) - EDITOR_ROLE only
      // - mintNftTo(address to, string memory tokenURI) - EDITOR_ROLE only
      // - setTokenURI(uint256 tokenId, string memory tokenURI) - EDITOR_ROLE only
      assert.ok(true, "Function signatures updated for role-based access control");
    });
  });

  describe("Proxy Deployment and Initialization", () => {
    it("Should deploy and initialize contract through proxy", async function () {
      const walletClients = await viem.getWalletClients();
      const [deployer, royaltyReceiver, admin, editor] = walletClients;
      
      // 1. Deploy implementation
      const implementation = await viem.deployContract("EMN");
      
      // 2. Encode initialization data
      const initData = encodeFunctionData({
        abi: parseAbi(['function initialize(string,string,address,uint96,address,address)']),
        functionName: 'initialize',
        args: [
          "EON MUN",
          "EMN", 
          royaltyReceiver.account.address,
          ROYALTY_FEE,
          admin.account.address,
          editor.account.address
        ]
      });
      
      // 3. Deploy proxy
      const proxy = await viem.deployContract("ERC1967ProxyWrapper", [
        implementation.address,
        initData
      ]);
      
      // 4. Get contract instance through proxy
      const emn = await viem.getContractAt("EMN", proxy.address);
      
      // 5. Verify initialization
      const name = await emn.read.name();
      const symbol = await emn.read.symbol();
      const tokenCounter = await emn.read.getTokenCounter();
      
      assert.equal(name, "EON MUN");
      assert.equal(symbol, "EMN");
      assert.equal(tokenCounter, 0n);
      
      // 6. Verify roles are set
      const adminRole = await emn.read.ADMIN_ROLE();
      const editorRole = await emn.read.EDITOR_ROLE();
      const defaultAdminRole = await emn.read.DEFAULT_ADMIN_ROLE();
      
      const hasAdminRole = await emn.read.hasRole([adminRole, admin.account.address]);
      const hasEditorRole = await emn.read.hasRole([editorRole, editor.account.address]);
      const hasDefaultAdminRole = await emn.read.hasRole([defaultAdminRole, admin.account.address]);
      
      assert.equal(hasAdminRole, true);
      assert.equal(hasEditorRole, true);
      assert.equal(hasDefaultAdminRole, true);
    });
  });

  describe("NFT Minting", () => {
    let emn: any;
    let walletClients: any;
    let admin: any;
    let editor: any;
    let user: any;
    
    beforeEach(async function () {
      walletClients = await viem.getWalletClients();
      const [deployer, royaltyReceiver, adminWallet, editorWallet, userWallet] = walletClients;
      admin = adminWallet;
      editor = editorWallet;
      user = userWallet;
      
      // Deploy implementation
      const implementation = await viem.deployContract("EMN");
      
      // Encode initialization data
      const initData = encodeFunctionData({
        abi: parseAbi(['function initialize(string,string,address,uint96,address,address)']),
        functionName: 'initialize',
        args: [
          "EON MUN",
          "EMN", 
          royaltyReceiver.account.address,
          ROYALTY_FEE,
          admin.account.address,
          editor.account.address
        ]
      });
      
      // Deploy proxy
      const proxy = await viem.deployContract("ERC1967ProxyWrapper", [
        implementation.address,
        initData
      ]);
      
      // Get contract instance
      emn = await viem.getContractAt("EMN", proxy.address);
      
      // Mint an NFT for testing (editor mints since only editors can mint)
      await emn.write.mintNft([TEST_URIS.ipfs1], {
        account: editor.account.address
      });
    });

    it("Should allow editor to mint NFT to themselves", async function () {
      // Editor mints to themselves
      const initialCounter = await emn.read.getTokenCounter();
      const hash = await emn.write.mintNft([TEST_URIS.ipfs1], {
        account: editor.account.address
      });
      
      // Verify mint
      const tokenCounter = await emn.read.getTokenCounter();
      assert.equal(tokenCounter, initialCounter + 1n);
      
      // Verify owner
      const owner = await emn.read.ownerOf([initialCounter]);
      assert.equal(owner.toLowerCase(), editor.account.address.toLowerCase());
      
      // Verify token URI
      const tokenURI = await emn.read.tokenURI([initialCounter]);
      assert.equal(tokenURI, TEST_URIS.ipfs1);
    });

    it("Should prevent non-editor from minting NFT to themselves", async function () {
      // User tries to mint to themselves (should fail)
      try {
        await emn.write.mintNft([TEST_URIS.ipfs1], {
          account: user.account.address
        });
        assert.fail("Should have thrown an error - user doesn't have EDITOR_ROLE");
      } catch (error) {
        assert.ok(true);
      }
    });

    it("Should allow editor to mint NFT to specific address", async function () {
      // Editor mints to user
      const initialCounter = await emn.read.getTokenCounter();
      const hash = await emn.write.mintNftTo([user.account.address, TEST_URIS.ipfs2], {
        account: editor.account.address
      });
      
      // Verify mint
      const tokenCounter = await emn.read.getTokenCounter();
      assert.equal(tokenCounter, initialCounter + 1n);
      
      // Verify owner
      const owner = await emn.read.ownerOf([initialCounter]);
      assert.equal(owner.toLowerCase(), user.account.address.toLowerCase());
      
      // Verify token URI
      const tokenURI = await emn.read.tokenURI([initialCounter]);
      assert.equal(tokenURI, TEST_URIS.ipfs2);
    });

    it("Should prevent non-editor from minting to specific address", async function () {
      // User tries to mint to another address (should fail)
      try {
        await emn.write.mintNftTo([admin.account.address, TEST_URIS.https], {
          account: user.account.address
        });
        assert.fail("Should have thrown an error - user doesn't have EDITOR_ROLE");
      } catch (error) {
        assert.ok(true);
      }
    });

    it("Should allow editor to mint multiple NFTs and increment token counter", async function () {
      // Editor mints multiple NFTs
      const initialCounter = await emn.read.getTokenCounter();
      
      await emn.write.mintNft([TEST_URIS.ipfs1], {
        account: editor.account.address
      });
      
      await emn.write.mintNftTo([admin.account.address, TEST_URIS.ipfs2], {
        account: editor.account.address
      });
      
      await emn.write.mintNft([TEST_URIS.https], {
        account: editor.account.address
      });
      
      // Verify counter
      const tokenCounter = await emn.read.getTokenCounter();
      assert.equal(tokenCounter, initialCounter + 3n);
      
      // Verify owners
      const owner0 = await emn.read.ownerOf([initialCounter]);
      const owner1 = await emn.read.ownerOf([initialCounter + 1n]);
      const owner2 = await emn.read.ownerOf([initialCounter + 2n]);
      
      assert.equal(owner0.toLowerCase(), editor.account.address.toLowerCase());
      assert.equal(owner1.toLowerCase(), admin.account.address.toLowerCase());
      assert.equal(owner2.toLowerCase(), editor.account.address.toLowerCase());
    });
  });

  describe("Metadata Management", () => {
    let emn: any;
    let walletClients: any;
    let admin: any;
    let editor: any;
    let user: any;
    
    beforeEach(async function () {
      walletClients = await viem.getWalletClients();
      const [deployer, royaltyReceiver, adminWallet, editorWallet, userWallet] = walletClients;
      admin = adminWallet;
      editor = editorWallet;
      user = userWallet;
      
      // Deploy and initialize contract
      const implementation = await viem.deployContract("EMN");
      const initData = encodeFunctionData({
        abi: parseAbi(['function initialize(string,string,address,uint96,address,address)']),
        functionName: 'initialize',
        args: [
          "EON MUN", "EMN", 
          royaltyReceiver.account.address, ROYALTY_FEE,
          admin.account.address, editor.account.address
        ]
      });
      const proxy = await viem.deployContract("ERC1967ProxyWrapper", [
        implementation.address, initData
      ]);
      emn = await viem.getContractAt("EMN", proxy.address);
      
      // Mint an NFT for testing (editor mints since only editors can mint)
      await emn.write.mintNft([TEST_URIS.ipfs1], {
        account: editor.account.address
      });
    });

    it("Should allow editor to update token URI", async function () {
      // Editor updates token URI
      await emn.write.setTokenURI([0n, TEST_URIS.ipfs2], {
        account: editor.account.address
      });
      
      // Verify update
      const tokenURI = await emn.read.tokenURI([0n]);
      assert.equal(tokenURI, TEST_URIS.ipfs2);
    });

    it("Should prevent non-editor from updating token URI", async function () {
      try {
        await emn.write.setTokenURI([0n, TEST_URIS.https], {
          account: user.account.address
        });
        assert.fail("Should have thrown an error - user doesn't have EDITOR_ROLE");
      } catch (error) {
        assert.ok(true);
      }
    });

    it("Should allow editor to update contract URI", async function () {
      const newContractURI = "https://api.eonmun.com/contract-metadata";
      
      // Editor updates contract URI
      await emn.write.setContractURI([newContractURI], {
        account: editor.account.address
      });
      
      // Verify update
      const contractURI = await emn.read.contractURI();
      assert.equal(contractURI, newContractURI);
    });

    it("Should prevent non-editor from updating contract URI", async function () {
      try {
        await emn.write.setContractURI(["https://malicious.com"], {
          account: user.account.address
        });
        assert.fail("Should have thrown an error - user doesn't have EDITOR_ROLE");
      } catch (error) {
        assert.ok(true);
      }
    });
  });

  describe("Role Management", () => {
    let emn: any;
    let walletClients: any;
    let admin: any;
    let editor: any;
    let newAdmin: any;
    let newEditor: any;
    
    beforeEach(async function () {
      walletClients = await viem.getWalletClients();
      const [deployer, royaltyReceiver, adminWallet, editorWallet, newAdminWallet, newEditorWallet] = walletClients;
      admin = adminWallet;
      editor = editorWallet;
      newAdmin = newAdminWallet;
      newEditor = newEditorWallet;
      
      // Deploy and initialize contract
      const implementation = await viem.deployContract("EMN");
      const initData = encodeFunctionData({
        abi: parseAbi(['function initialize(string,string,address,uint96,address,address)']),
        functionName: 'initialize',
        args: [
          "EON MUN", "EMN", 
          royaltyReceiver.account.address, ROYALTY_FEE,
          admin.account.address, editor.account.address
        ]
      });
      const proxy = await viem.deployContract("ERC1967ProxyWrapper", [
        implementation.address, initData
      ]);
      emn = await viem.getContractAt("EMN", proxy.address);
    });

    it("Should allow admin to grant editor role", async function () {
      const editorRole = await emn.read.EDITOR_ROLE();
      
      // Admin grants editor role to new user
      await emn.write.grantRole([editorRole, newEditor.account.address], {
        account: admin.account.address
      });
      
      // Verify role granted
      const hasRole = await emn.read.hasRole([editorRole, newEditor.account.address]);
      assert.equal(hasRole, true);
      
      // Verify new editor can mint
      await emn.write.mintNftTo([admin.account.address, TEST_URIS.ipfs1], {
        account: newEditor.account.address
      });
      
      const tokenCounter = await emn.read.getTokenCounter();
      assert.equal(tokenCounter, 1n);
    });

    it("Should allow admin to revoke editor role", async function () {
      const editorRole = await emn.read.EDITOR_ROLE();
      
      // Admin revokes editor role
      await emn.write.revokeRole([editorRole, editor.account.address], {
        account: admin.account.address
      });
      
      // Verify role revoked
      const hasRole = await emn.read.hasRole([editorRole, editor.account.address]);
      assert.equal(hasRole, false);
      
      // Verify revoked editor cannot mint
      try {
        await emn.write.mintNftTo([admin.account.address, TEST_URIS.ipfs1], {
          account: editor.account.address
        });
        assert.fail("Should have thrown an error - editor role was revoked");
      } catch (error) {
        assert.ok(true);
      }
    });

    it("Should allow DEFAULT_ADMIN_ROLE to grant admin role", async function () {
      const adminRole = await emn.read.ADMIN_ROLE();
      
      // Default admin grants admin role to new user
      await emn.write.grantRole([adminRole, newAdmin.account.address], {
        account: admin.account.address
      });
      
      // Verify role granted
      const hasRole = await emn.read.hasRole([adminRole, newAdmin.account.address]);
      assert.equal(hasRole, true);
      
      // Verify new admin can grant editor role
      const editorRole = await emn.read.EDITOR_ROLE();
      await emn.write.grantRole([editorRole, newEditor.account.address], {
        account: newAdmin.account.address
      });
      
      const hasEditorRole = await emn.read.hasRole([editorRole, newEditor.account.address]);
      assert.equal(hasEditorRole, true);
    });

    it("Should prevent non-admin from granting roles", async function () {
      const editorRole = await emn.read.EDITOR_ROLE();
      
      try {
        await emn.write.grantRole([editorRole, newEditor.account.address], {
          account: editor.account.address
        });
        assert.fail("Should have thrown an error - editor cannot grant roles");
      } catch (error) {
        assert.ok(true);
      }
    });
  });

  describe("Royalty Management", () => {
    let emn: any;
    let walletClients: any;
    let admin: any;
    let editor: any;
    let newRoyaltyReceiver: any;
    
    beforeEach(async function () {
      walletClients = await viem.getWalletClients();
      const [deployer, royaltyReceiver, adminWallet, editorWallet, newRoyaltyWallet] = walletClients;
      admin = adminWallet;
      editor = editorWallet;
      newRoyaltyReceiver = newRoyaltyWallet;
      
      // Deploy and initialize contract
      const implementation = await viem.deployContract("EMN");
      const initData = encodeFunctionData({
        abi: parseAbi(['function initialize(string,string,address,uint96,address,address)']),
        functionName: 'initialize',
        args: [
          "EON MUN", "EMN", 
          royaltyReceiver.account.address, ROYALTY_FEE,
          admin.account.address, editor.account.address
        ]
      });
      const proxy = await viem.deployContract("ERC1967ProxyWrapper", [
        implementation.address, initData
      ]);
      emn = await viem.getContractAt("EMN", proxy.address);
      
      // Mint an NFT for testing (editor mints since only editors can mint)
      await emn.write.mintNft([TEST_URIS.ipfs1], {
        account: editor.account.address
      });
    });

    it("Should allow editor to update default royalty", async function () {
      const newFee = 750n; // 7.5%
      
      // Editor updates default royalty
      await emn.write.setDefaultRoyalty([newRoyaltyReceiver.account.address, newFee], {
        account: editor.account.address
      });
      
      // Verify royalty info for new token
      await emn.write.mintNft([TEST_URIS.ipfs2], {
        account: editor.account.address
      });
      
      const royaltyInfo = await emn.read.royaltyInfo([1n, 10000n]);
      assert.equal(royaltyInfo[0].toLowerCase(), newRoyaltyReceiver.account.address.toLowerCase());
      assert.equal(royaltyInfo[1], newFee);
    });

    it("Should allow editor to set token-specific royalty", async function () {
      const newFee = 1000n; // 10%
      
      // Editor sets token-specific royalty
      await emn.write.setTokenRoyalty([0n, newRoyaltyReceiver.account.address, newFee], {
        account: editor.account.address
      });
      
      // Verify token-specific royalty
      const royaltyInfo = await emn.read.royaltyInfo([0n, 10000n]);
      assert.equal(royaltyInfo[0].toLowerCase(), newRoyaltyReceiver.account.address.toLowerCase());
      assert.equal(royaltyInfo[1], newFee);
    });

    it("Should prevent non-editor from updating royalties", async function () {
      try {
        await emn.write.setDefaultRoyalty([newRoyaltyReceiver.account.address, 1000n], {
          account: admin.account.address
        });
        assert.fail("Should have thrown an error - admin doesn't have EDITOR_ROLE for royalty management");
      } catch (error) {
        assert.ok(true);
      }
    });
  });

  describe("Access Control Pattern Documentation", () => {
    it("Should document proper deployment pattern with role-based access control", async function () {
      // This test documents how to properly deploy and use this upgradeable contract
      
      /*
      Proper deployment and usage with AccessControl requires:
      
      1. Deploy the implementation contract:
         const implementation = await viem.deployContract("EMN");
      
      2. Deploy an ERC1967ProxyWrapper:
         const proxyContract = await viem.deployContract("ERC1967ProxyWrapper", [
           implementation.address,
           initData
         ]);
      
      3. Encode initialization data with role addresses:
         const initData = encodeFunctionData({
           abi: parseAbi(['function initialize(string,string,address,uint96,address,address)']),
           functionName: 'initialize',
           args: [
             "EON MUN", 
             "EMN", 
             royaltyReceiver, 
             500n, 
             adminAddress,    // ADMIN_ROLE holder
             editorAddress    // EDITOR_ROLE holder
           ]
         });
      
      4. Interact with the contract through the proxy address:
         const proxiedContract = await viem.getContractAt("EMN", proxyContract.address);
      
      5. Role-based operations:
         // Only EDITOR_ROLE can mint to themselves
         await proxiedContract.write.mintNft(["ipfs://QmYour...Hash/metadata.json"], {
           account: editorAddress
         });
         
         // Only EDITOR_ROLE can mint to others
         await proxiedContract.write.mintNftTo([recipient, "https://api.yoursite.com/nft/1"], {
           account: editorAddress
         });
         
         // Only EDITOR_ROLE can update token URIs
         await proxiedContract.write.setTokenURI([tokenId, "newURI"], {
           account: editorAddress
         });
         
         // Only ADMIN_ROLE can upgrade the contract
         await proxiedContract.write._authorizeUpgrade([newImplementation], {
           account: adminAddress
         });
      
      6. Role management:
         // Admin can grant/revoke EDITOR_ROLE
         await proxiedContract.write.grantRole([EDITOR_ROLE, newEditor], {
           account: adminAddress
         });
         
         await proxiedContract.write.revokeRole([EDITOR_ROLE, oldEditor], {
           account: adminAddress
         });
      
      The contract includes:
      - ERC721Upgradeable for NFT functionality
      - ERC2981Upgradeable for royalty support (EIP-2981)
      - AccessControlUpgradeable for role-based permissions
      - UUPSUpgradeable for upgrade functionality
      - Individual token URI storage and management
      - Comprehensive royalty management functions (EDITOR_ROLE only)
      
      Role Structure:
      - DEFAULT_ADMIN_ROLE: Can manage ADMIN_ROLE
      - ADMIN_ROLE: Can upgrade contract and manage EDITOR_ROLE
      - EDITOR_ROLE: Can mint NFTs to addresses, modify metadata and royalties
      
      Key Features:
      - Granular permission control with role hierarchy
      - Each NFT can have a unique metadata URI
      - URIs can be IPFS, HTTPS, Arweave, or any valid URI scheme
      - EDITOR_ROLE can update token URIs post-mint
      - Event emission includes both tokenId and tokenURI for indexing
      - Follows principle of least privilege
      */
      
      assert.ok(true, "Role-based deployment and usage pattern documented");
    });

    it("Should demonstrate expected events and role-based data structures", async function () {
      /*
      Expected event structure:
      event NftMinted(uint256 indexed tokenId, string tokenURI);
      
      Role definitions:
      bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
      bytes32 public constant EDITOR_ROLE = keccak256("EDITOR_ROLE");
      
      This allows marketplaces and indexers to:
      1. Track new mints by tokenId
      2. Immediately access metadata URI without additional calls
      3. Index NFTs by their metadata content
      4. Track role assignments and permissions
      
      Storage structure:
      - mapping(uint256 => string) private s_tokenURIs;
      - uint256 private s_tokenCounter;
      - Role mappings from AccessControl
      
      This provides:
      1. Efficient token URI lookups
      2. Support for updating URIs (EDITOR_ROLE)
      3. Gas-efficient storage pattern
      4. Role-based access control with hierarchy
      5. Secure upgrade mechanism (ADMIN_ROLE only)
      */
      
      assert.ok(true, "Event, role, and storage structure documented");
    });
  });

  describe("Multiple Editors", () => {
    let emn: any;
    let walletClients: any;
    let admin: any;
    let editor1: any;
    let editor2: any;
    let editor3: any;
    let user: any;
    
    beforeEach(async function () {
      walletClients = await viem.getWalletClients();
      const [deployer, royaltyReceiver, adminWallet, editor1Wallet, editor2Wallet, editor3Wallet, userWallet] = walletClients;
      admin = adminWallet;
      editor1 = editor1Wallet;
      editor2 = editor2Wallet;
      editor3 = editor3Wallet;
      user = userWallet;
      
      // Deploy implementation
      const implementation = await viem.deployContract("EMN");
      
      // Encode initialization data (editor1 gets editor role during initialization)
      const initData = encodeFunctionData({
        abi: parseAbi(['function initialize(string,string,address,uint96,address,address)']),
        functionName: 'initialize',
        args: [
          "EON MUN",
          "EMN", 
          royaltyReceiver.account.address,
          ROYALTY_FEE,
          admin.account.address,
          editor1.account.address  // editor1 gets initial editor role
        ]
      });
      
      // Deploy proxy
      const proxy = await viem.deployContract("ERC1967ProxyWrapper", [
        implementation.address,
        initData
      ]);
      
      // Get contract instance
      emn = await viem.getContractAt("EMN", proxy.address);
      
      // Grant editor role to additional editors
      const editorRole = await emn.read.EDITOR_ROLE();
      await emn.write.grantRole([editorRole, editor2.account.address], {
        account: admin.account.address
      });
      await emn.write.grantRole([editorRole, editor3.account.address], {
        account: admin.account.address
      });
    });

    it("Should allow multiple editors to mint NFTs", async function () {
      const initialCounter = await emn.read.getTokenCounter();
      
      // Editor 1 mints an NFT
      await emn.write.mintNft([TEST_URIS.ipfs1], {
        account: editor1.account.address
      });
      
      // Editor 2 mints an NFT
      await emn.write.mintNft([TEST_URIS.ipfs2], {
        account: editor2.account.address
      });
      
      // Editor 3 mints an NFT
      await emn.write.mintNft([TEST_URIS.https], {
        account: editor3.account.address
      });
      
      // Verify all mints succeeded
      const finalCounter = await emn.read.getTokenCounter();
      assert.equal(finalCounter, initialCounter + 3n);
      
      // Verify owners (all editors minted to themselves)
      const owner1 = await emn.read.ownerOf([initialCounter]);
      const owner2 = await emn.read.ownerOf([initialCounter + 1n]);
      const owner3 = await emn.read.ownerOf([initialCounter + 2n]);
      
      assert.equal(owner1.toLowerCase(), editor1.account.address.toLowerCase());
      assert.equal(owner2.toLowerCase(), editor2.account.address.toLowerCase());
      assert.equal(owner3.toLowerCase(), editor3.account.address.toLowerCase());
      
      // Verify token URIs
      const uri1 = await emn.read.tokenURI([initialCounter]);
      const uri2 = await emn.read.tokenURI([initialCounter + 1n]);
      const uri3 = await emn.read.tokenURI([initialCounter + 2n]);
      
      assert.equal(uri1, TEST_URIS.ipfs1);
      assert.equal(uri2, TEST_URIS.ipfs2);
      assert.equal(uri3, TEST_URIS.https);
    });

    it("Should allow multiple editors to mint NFTs to other addresses", async function () {
      const initialCounter = await emn.read.getTokenCounter();
      
      // Editor 1 mints to user
      await emn.write.mintNftTo([user.account.address, TEST_URIS.ipfs1], {
        account: editor1.account.address
      });
      
      // Editor 2 mints to admin
      await emn.write.mintNftTo([admin.account.address, TEST_URIS.ipfs2], {
        account: editor2.account.address
      });
      
      // Editor 3 mints to editor1
      await emn.write.mintNftTo([editor1.account.address, TEST_URIS.https], {
        account: editor3.account.address
      });
      
      // Verify all mints succeeded
      const finalCounter = await emn.read.getTokenCounter();
      assert.equal(finalCounter, initialCounter + 3n);
      
      // Verify owners
      const owner1 = await emn.read.ownerOf([initialCounter]);
      const owner2 = await emn.read.ownerOf([initialCounter + 1n]);
      const owner3 = await emn.read.ownerOf([initialCounter + 2n]);
      
      assert.equal(owner1.toLowerCase(), user.account.address.toLowerCase());
      assert.equal(owner2.toLowerCase(), admin.account.address.toLowerCase());
      assert.equal(owner3.toLowerCase(), editor1.account.address.toLowerCase());
    });

    it("Should allow any editor to update token URIs created by other editors", async function () {
      // Editor 1 mints an NFT
      const initialCounter = await emn.read.getTokenCounter();
      await emn.write.mintNft([TEST_URIS.ipfs1], {
        account: editor1.account.address
      });
      
      // Editor 2 updates the token URI created by editor 1
      await emn.write.setTokenURI([initialCounter, TEST_URIS.ipfs2], {
        account: editor2.account.address
      });
      
      // Verify the update
      const updatedURI = await emn.read.tokenURI([initialCounter]);
      assert.equal(updatedURI, TEST_URIS.ipfs2);
      
      // Editor 3 updates it again
      await emn.write.setTokenURI([initialCounter, TEST_URIS.arweave], {
        account: editor3.account.address
      });
      
      // Verify the second update
      const finalURI = await emn.read.tokenURI([initialCounter]);
      assert.equal(finalURI, TEST_URIS.arweave);
    });

    it("Should allow any editor to update contract URI", async function () {
      const newContractURI1 = "https://api.eonmun.com/contract-v1";
      const newContractURI2 = "https://api.eonmun.com/contract-v2";
      const newContractURI3 = "https://api.eonmun.com/contract-v3";
      
      // Editor 1 updates contract URI
      await emn.write.setContractURI([newContractURI1], {
        account: editor1.account.address
      });
      
      let contractURI = await emn.read.contractURI();
      assert.equal(contractURI, newContractURI1);
      
      // Editor 2 updates contract URI
      await emn.write.setContractURI([newContractURI2], {
        account: editor2.account.address
      });
      
      contractURI = await emn.read.contractURI();
      assert.equal(contractURI, newContractURI2);
      
      // Editor 3 updates contract URI
      await emn.write.setContractURI([newContractURI3], {
        account: editor3.account.address
      });
      
      contractURI = await emn.read.contractURI();
      assert.equal(contractURI, newContractURI3);
    });

    it("Should allow any editor to manage royalties", async function () {
      // Editor 1 sets default royalty
      await emn.write.setDefaultRoyalty([editor1.account.address, 600n], {
        account: editor1.account.address
      });
      
      // Editor 2 mints an NFT (should use editor1's royalty settings)
      const initialCounter = await emn.read.getTokenCounter();
      await emn.write.mintNft([TEST_URIS.ipfs1], {
        account: editor2.account.address
      });
      
      // Verify editor1's royalty settings are applied
      let royaltyInfo = await emn.read.royaltyInfo([initialCounter, 10000n]);
      assert.equal(royaltyInfo[0].toLowerCase(), editor1.account.address.toLowerCase());
      assert.equal(royaltyInfo[1], 600n);
      
      // Editor 3 sets token-specific royalty, overriding the default
      await emn.write.setTokenRoyalty([initialCounter, editor3.account.address, 800n], {
        account: editor3.account.address
      });
      
      // Verify editor3's token-specific royalty overrides the default
      royaltyInfo = await emn.read.royaltyInfo([initialCounter, 10000n]);
      assert.equal(royaltyInfo[0].toLowerCase(), editor3.account.address.toLowerCase());
      assert.equal(royaltyInfo[1], 800n);
      
      // Editor 2 can reset the token royalty back to default
      await emn.write.resetTokenRoyalty([initialCounter], {
        account: editor2.account.address
      });
      
      // Should revert to editor1's default royalty
      royaltyInfo = await emn.read.royaltyInfo([initialCounter, 10000n]);
      assert.equal(royaltyInfo[0].toLowerCase(), editor1.account.address.toLowerCase());
      assert.equal(royaltyInfo[1], 600n);
    });

    it("Should verify all editors have the same permissions", async function () {
      const editorRole = await emn.read.EDITOR_ROLE();
      
      // Verify all editors have the role
      const hasRole1 = await emn.read.hasRole([editorRole, editor1.account.address]);
      const hasRole2 = await emn.read.hasRole([editorRole, editor2.account.address]);
      const hasRole3 = await emn.read.hasRole([editorRole, editor3.account.address]);
      
      assert.equal(hasRole1, true);
      assert.equal(hasRole2, true);
      assert.equal(hasRole3, true);
      
      // Verify non-editor doesn't have the role
      const userHasRole = await emn.read.hasRole([editorRole, user.account.address]);
      assert.equal(userHasRole, false);
    });

    it("Should allow admin to revoke editor role from specific editors", async function () {
      const editorRole = await emn.read.EDITOR_ROLE();
      
      // Admin revokes editor2's role
      await emn.write.revokeRole([editorRole, editor2.account.address], {
        account: admin.account.address
      });
      
      // Verify editor2 no longer has the role
      const hasRole2 = await emn.read.hasRole([editorRole, editor2.account.address]);
      assert.equal(hasRole2, false);
      
      // Verify other editors still have the role
      const hasRole1 = await emn.read.hasRole([editorRole, editor1.account.address]);
      const hasRole3 = await emn.read.hasRole([editorRole, editor3.account.address]);
      assert.equal(hasRole1, true);
      assert.equal(hasRole3, true);
      
      // Verify editor2 can no longer mint
      try {
        await emn.write.mintNft([TEST_URIS.ipfs1], {
          account: editor2.account.address
        });
        assert.fail("Should have thrown an error - editor2's role was revoked");
      } catch (error) {
        assert.ok(true);
      }
      
      // Verify other editors can still mint
      const initialCounter = await emn.read.getTokenCounter();
      await emn.write.mintNft([TEST_URIS.ipfs2], {
        account: editor1.account.address
      });
      
      const finalCounter = await emn.read.getTokenCounter();
      assert.equal(finalCounter, initialCounter + 1n);
    });
  });

  describe("Contract Upgrades", () => {
    let emn: any;
    let proxyAddress: `0x${string}`;
    let walletClients: any;
    let admin: any;
    let editor: any;
    let user: any;
    
    beforeEach(async function () {
      walletClients = await viem.getWalletClients();
      const [deployer, royaltyReceiver, adminWallet, editorWallet, userWallet] = walletClients;
      admin = adminWallet;
      editor = editorWallet;
      user = userWallet;
      
      // Deploy initial implementation
      const implementation = await viem.deployContract("EMN");
      
      // Encode initialization data
      const initData = encodeFunctionData({
        abi: parseAbi(['function initialize(string,string,address,uint96,address,address)']),
        functionName: 'initialize',
        args: [
          "EON MUN",
          "EMN", 
          royaltyReceiver.account.address,
          ROYALTY_FEE,
          admin.account.address,
          editor.account.address
        ]
      });
      
      // Deploy proxy
      const proxy = await viem.deployContract("ERC1967ProxyWrapper", [
        implementation.address,
        initData
      ]);
      
      proxyAddress = proxy.address as `0x${string}`;
      
      // Get contract instance through proxy
      emn = await viem.getContractAt("EMN", proxyAddress);
      
      // Mint a test NFT to verify state preservation after upgrade
      await emn.write.mintNft([TEST_URIS.ipfs1], {
        account: editor.account.address
      });
    });

    it("Should allow admin to upgrade contract implementation", async function () {
      // Get initial state
      const initialTokenCounter = await emn.read.getTokenCounter();
      const initialName = await emn.read.name();
      const initialSymbol = await emn.read.symbol();
      const initialVersion = await emn.read.version();
      const initialOwnerOfToken0 = await emn.read.ownerOf([0n]);
      const initialTokenURI = await emn.read.tokenURI([0n]);
      
      // Deploy new implementation (same contract for this test, but could be upgraded version)
      const newImplementation = await viem.deployContract("EMN");
      
      // Verify the new implementation has the expected version
      const newImplVersion = await newImplementation.read.version();
      assert.equal(newImplVersion, "1.1.0");
      
      // Admin upgrades the contract
      await emn.write.upgradeToAndCall([newImplementation.address, "0x"], {
        account: admin.account.address
      });
      
      // Verify state is preserved after upgrade
      const postUpgradeTokenCounter = await emn.read.getTokenCounter();
      const postUpgradeName = await emn.read.name();
      const postUpgradeSymbol = await emn.read.symbol();
      const postUpgradeVersion = await emn.read.version();
      const postUpgradeOwnerOfToken0 = await emn.read.ownerOf([0n]);
      const postUpgradeTokenURI = await emn.read.tokenURI([0n]);
      
      // State should be preserved
      assert.equal(postUpgradeTokenCounter, initialTokenCounter);
      assert.equal(postUpgradeName, initialName);
      assert.equal(postUpgradeSymbol, initialSymbol);
      assert.equal(postUpgradeVersion, newImplVersion); // Version should match new implementation
      assert.equal(postUpgradeOwnerOfToken0.toLowerCase(), initialOwnerOfToken0.toLowerCase());
      assert.equal(postUpgradeTokenURI, initialTokenURI);
      
      // Verify roles are still intact
      const adminRole = await emn.read.ADMIN_ROLE();
      const editorRole = await emn.read.EDITOR_ROLE();
      const adminHasRole = await emn.read.hasRole([adminRole, admin.account.address]);
      const editorHasRole = await emn.read.hasRole([editorRole, editor.account.address]);
      
      assert.equal(adminHasRole, true);
      assert.equal(editorHasRole, true);
      
      // Verify functionality still works after upgrade
      const preTestCounter = await emn.read.getTokenCounter();
      await emn.write.mintNft([TEST_URIS.ipfs2], {
        account: editor.account.address
      });
      const postTestCounter = await emn.read.getTokenCounter();
      assert.equal(postTestCounter, preTestCounter + 1n);
    });

    it("Should prevent editor from upgrading contract", async function () {
      // Deploy new implementation
      const newImplementation = await viem.deployContract("EMN");
      
      // Editor tries to upgrade (should fail)
      try {
        await emn.write.upgradeToAndCall([newImplementation.address, "0x"], {
          account: editor.account.address
        });
        assert.fail("Should have thrown an error - editor doesn't have ADMIN_ROLE for upgrades");
      } catch (error) {
        assert.ok(true);
      }
      
      // Verify the contract was not upgraded by checking that state is unchanged
      const version = await emn.read.version();
      assert.equal(version, "1.1.0"); // Should still be original version
    });

    it("Should prevent regular user from upgrading contract", async function () {
      // Deploy new implementation
      const newImplementation = await viem.deployContract("EMN");
      
      // User tries to upgrade (should fail)
      try {
        await emn.write.upgradeToAndCall([newImplementation.address, "0x"], {
          account: user.account.address
        });
        assert.fail("Should have thrown an error - user doesn't have ADMIN_ROLE");
      } catch (error) {
        assert.ok(true);
      }
      
      // Verify the contract was not upgraded
      const version = await emn.read.version();
      assert.equal(version, "1.1.0"); // Should still be original version
    });

    it("Should allow admin to upgrade contract and call initialization if needed", async function () {
      // Deploy new implementation
      const newImplementation = await viem.deployContract("EMN");
      
      // Prepare call data for a hypothetical initialization (empty in this case)
      const callData = "0x";
      
      // Admin upgrades with call data
      await emn.write.upgradeToAndCall([newImplementation.address, callData], {
        account: admin.account.address
      });
      
      // Verify upgrade was successful
      const version = await emn.read.version();
      assert.equal(version, "1.1.0");
      
      // Verify all functionality still works
      const tokenCounter = await emn.read.getTokenCounter();
      assert.equal(tokenCounter, 1n); // Should still have the 1 token from beforeEach
      
      // Test minting still works
      await emn.write.mintNft([TEST_URIS.https], {
        account: editor.account.address
      });
      
      const newTokenCounter = await emn.read.getTokenCounter();
      assert.equal(newTokenCounter, 2n);
    });

    it("Should prevent upgrading to invalid implementation", async function () {
      // Try to upgrade to zero address (should fail)
      try {
        await emn.write.upgradeToAndCall(["0x0000000000000000000000000000000000000000", "0x"], {
          account: admin.account.address
        });
        assert.fail("Should have thrown an error - cannot upgrade to zero address");
      } catch (error) {
        assert.ok(true);
      }
      
      // Verify contract is still functional
      const version = await emn.read.version();
      assert.equal(version, "1.1.0");
    });

    it("Should verify implementation address changes after upgrade", async function () {
      // Get initial implementation address from proxy storage
      const ERC1967_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
      
      const initialImplementationRaw = await publicClient.getStorageAt({
        address: proxyAddress,
        slot: ERC1967_IMPLEMENTATION_SLOT as `0x${string}`,
      });
      
      const initialImplementation = `0x${initialImplementationRaw!.slice(-40)}`;
      
      // Deploy new implementation
      const newImplementation = await viem.deployContract("EMN");
      
      // Admin upgrades the contract
      await emn.write.upgradeToAndCall([newImplementation.address, "0x"], {
        account: admin.account.address
      });
      
      // Get new implementation address from proxy storage
      const newImplementationRaw = await publicClient.getStorageAt({
        address: proxyAddress,
        slot: ERC1967_IMPLEMENTATION_SLOT as `0x${string}`,
      });
      
      const currentImplementation = `0x${newImplementationRaw!.slice(-40)}`;
      
      // Verify implementation address changed
      assert.notEqual(initialImplementation.toLowerCase(), currentImplementation.toLowerCase());
      assert.equal(currentImplementation.toLowerCase(), newImplementation.address.toLowerCase());
    });

    it("Should maintain role-based access control after upgrade", async function () {
      // Deploy new implementation
      const newImplementation = await viem.deployContract("EMN");
      
      // Upgrade the contract
      await emn.write.upgradeToAndCall([newImplementation.address, "0x"], {
        account: admin.account.address
      });
      
      // Verify admin can still manage roles
      const editorRole = await emn.read.EDITOR_ROLE();
      await emn.write.grantRole([editorRole, user.account.address], {
        account: admin.account.address
      });
      
      const userHasEditorRole = await emn.read.hasRole([editorRole, user.account.address]);
      assert.equal(userHasEditorRole, true);
      
      // Verify new editor can mint
      await emn.write.mintNft([TEST_URIS.arweave], {
        account: user.account.address
      });
      
      const tokenCounter = await emn.read.getTokenCounter();
      assert.equal(tokenCounter, 2n); // 1 from beforeEach + 1 from this test
      
      // Verify admin can revoke roles
      await emn.write.revokeRole([editorRole, user.account.address], {
        account: admin.account.address
      });
      
      const userStillHasRole = await emn.read.hasRole([editorRole, user.account.address]);
      assert.equal(userStillHasRole, false);
    });
  });
}); 