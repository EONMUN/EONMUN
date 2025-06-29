import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BasicNftRoyaltiesModule", (m) => {
  const addresses = {
    deployer: m.getAccount(0),
    royaltyReceiver: m.getAccount(1),
  };

  // Configuration parameters for the BasicNftRoyalties contract
  const royaltyReceiver = m.getParameter("royaltyReceiver", addresses.royaltyReceiver);
  const royaltyFeeNumerator = m.getParameter("royaltyFeeNumerator", 500n); // 5% default royalty (500 basis points)

  // Step 1: Deploy the implementation contract
  const implementation = m.contract("EMN", [], {
    id: "BasicNftRoyalties_Implementation"
  });

  // Step 2: Encode the initialization data
  const initializeCalldata = m.encodeFunctionCall(
    implementation,
    "initialize",
    [royaltyReceiver, royaltyFeeNumerator],
    { id: "encodeInitialize" }
  );

  // Step 3: Deploy the ERC1967Proxy with initialization data
  const proxy = m.contract("ERC1967ProxyWrapper", [implementation, initializeCalldata], {
    id: "EMN_Proxy"
  });

  // Step 4: Get the contract instance at proxy address for interactions
  const emn = m.contractAt("EMN", proxy, {
    id: "EMN_Proxied"
  });

  // Optional: Mint some initial NFTs for testing/demo purposes
  const shouldMintInitial = m.getParameter("mintInitialNfts", true);
  
  if (shouldMintInitial) {
    // Define example token URIs
    const tokenURI1 = m.getParameter("tokenURI1", "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/0-PUG.json");
    const tokenURI2 = m.getParameter("tokenURI2", "https://api.example.com/nft/metadata/1.json");
    
    // Mint first NFT to deployer with URI
    m.call(emn, "mintNft", [tokenURI1], {
      id: "mintInitialNft_0",
      from: addresses.deployer
    });
    
    // Mint second NFT to royalty receiver with different URI
    m.call(emn, "mintNftTo", [addresses.royaltyReceiver, tokenURI2], {
      id: "mintInitialNft_1",
      from: addresses.deployer
    });
  }

  return { 
    implementation,
    proxy, 
    emn
  };
});