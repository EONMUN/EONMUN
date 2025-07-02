import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";

export default buildModule("EMNModule", (m) => {
  const addresses = {
    deployer: m.getAccount(0),
    royaltyReceiver: "0x184bD866ea2600f760D51D888140Fa142195f628",
    ncrmro: "0xDf095CA41Af452ED9ED390D8fAC260Fbdad20976"
  };

  // Configuration parameters for the BasicNftRoyalties contract
  const royaltyReceiver = m.getParameter("royaltyReceiver", addresses.royaltyReceiver);
  const royaltyFeeNumerator = m.getParameter("royaltyFeeNumerator", 500n); // 5% default royalty (500 basis points)

  // Step 1: Deploy the implementation contract
  const implementation = m.contract("EMN", [], {
    id: "EMN_Implementation"
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
  
  // // Define example token URIs
  // const tokenURI1 = m.getParameter("tokenURI1", "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/0-PUG.json");
  // const tokenURI2 = m.getParameter("tokenURI2", "https://api.example.com/nft/metadata/1.json");
  
  // m.call(emn, "transferOwnership", [addresses.ncrmro], {
  //   id: "transferOwnership_0",
  //   from: addresses.deployer
  // });
    

  return { 
    implementation,
    proxy, 
    emn
  };
});