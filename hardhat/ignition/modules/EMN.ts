import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EMNModule", (m) => {

  // Configuration parameters for the EMN contract
  const name = m.getParameter("name");
  const symbol = m.getParameter("symbol");
  const royaltyReceiver = m.getParameter("royaltyReceiver");
  const royaltyFeeNumerator = m.getParameter("royaltyFeeNumerator", 500n); // 5% default royalty (500 basis points)
  const admin = m.getParameter("admin");
  const editor = m.getParameter("editor");
  
  // Optional parameters for initial NFT minting
  const shouldMintInitial = m.getParameter("mintInitialNfts", false);
  const tokenURI1 = m.getParameter("tokenURI1", "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/0-PUG.json");
  const tokenURI2 = m.getParameter("tokenURI2", "https://api.example.com/nft/metadata/1.json");

  // Step 1: Deploy the implementation contract
  const implementation = m.contract("EMN", [], {
    id: "EMN_Implementation"
  });

  // Step 2: Encode the initialization data with all 6 required parameters
  const initializeCalldata = m.encodeFunctionCall(
    implementation,
    "initialize",
    [name, symbol, royaltyReceiver, royaltyFeeNumerator, admin, editor],
    { id: "encodeInitialize" }
  );

  // Step 3: Deploy the ERC1967Proxy with initialization data
  const proxy = m.contract("ERC1967ProxyWrapper", [implementation, initializeCalldata], {
    id: "EMN_Proxy"
  });


  // Step 5: Conditionally mint initial NFTs if requested
  // Note: Minting must be done by an account with EDITOR_ROLE (ncrmro address)
  // if (shouldMintInitial) {
  //   // Mint first NFT to the admin address
  //   m.call(emn, "mintNftTo", [admin, tokenURI1], {
  //     id: "mintInitialNFT_1",
  //     from: addresses.ncrmro
  //   });

  //   // Mint second NFT to the admin address
  //   m.call(emn, "mintNftTo", [admin, tokenURI2], {
  //     id: "mintInitialNFT_2",
  //     from: addresses.ncrmro
  //   });
  // }

  return { 
    implementation,
    proxy
  };
});