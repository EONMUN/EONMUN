# EMN Ignition Deployment Parameters

This directory contains parameter files for deploying the EMN contract with different configurations.

## Parameter Files

### `mainnet-params.json`
- **Purpose**: Production mainnet deployment
- **Name**: "EON MUN"
- **Symbol**: "EMN"
- **Royalty Receiver**: Official project address
- **Royalty Fee**: 5% (500 basis points)
- **Admin & Editor**: Project owner address

### `testnet-params.json`
- **Purpose**: Testnet deployment for testing
- **Name**: "EON MUN Testnet"
- **Symbol**: "EMN-TEST"
- **Royalty Receiver**: Test address
- **Royalty Fee**: 2.5% (250 basis points)
- **Admin & Editor**: Test address

### `development-params.json`
- **Purpose**: Local development with all features enabled
- **Name**: "EON MUN Development"
- **Symbol**: "EMN-DEV"
- **Royalty Receiver**: Development address
- **Royalty Fee**: 1% (100 basis points)
- **Admin & Editor**: Development address
- **Includes**: Initial NFT minting parameters

## Usage

### Deploy to Mainnet
```bash
npx hardhat ignition deploy ./ignition/modules/EMN.ts --network mainnet --parameters ./ignition/parameters/mainnet-params.json
```

### Deploy to Testnet (Sepolia)
```bash
npx hardhat ignition deploy ./ignition/modules/EMN.ts --network sepolia --parameters ./ignition/parameters/testnet-params.json
```

### Deploy to Local Development
```bash
npx hardhat ignition deploy ./ignition/modules/EMN.ts --network localhost --parameters ./ignition/parameters/development-params.json
```

## Parameter Structure

The JSON files must follow this structure:
```json
{
  "EMNModule": {
    "parameterName": "value"
  }
}
```

Where `EMNModule` matches the module name in your `buildModule("EMNModule", ...)` call.

## Available Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `name` | string | ERC721 token name | `"EON MUN"` |
| `symbol` | string | ERC721 token symbol | `"EMN"` |
| `royaltyReceiver` | string | Address to receive royalty payments | `0x184bD866ea2600f760D51D888140Fa142195f628` |
| `royaltyFeeNumerator` | string | Royalty fee in basis points (500 = 5%) | `500` |
| `admin` | string | Address with admin privileges (can upgrade contract) | `0xDf095CA41Af452ED9ED390D8fAC260Fbdad20976` |
| `editor` | string | Address with editor privileges (can mint NFTs) | `0xDf095CA41Af452ED9ED390D8fAC260Fbdad20976` |
| `mintInitialNfts` | boolean | Whether to mint initial NFTs | `false` |
| `tokenURI1` | string | URI for first test NFT | IPFS hash |
| `tokenURI2` | string | URI for second test NFT | Example API URL |

## Role-Based Access Control

The EMN contract uses OpenZeppelin's AccessControl system with two main roles:

### Admin Role (`ADMIN_ROLE`)
- Can upgrade the contract (UUPS upgradeable)
- Can manage roles and permissions
- Inherits `DEFAULT_ADMIN_ROLE` privileges

### Editor Role (`EDITOR_ROLE`)
- Can mint NFTs using `mintNft()` and `mintNftTo()`
- Can set and modify royalty settings
- Can update token URIs and contract metadata
- Can manage contract URI

## Important Notes

- **Role Assignment**: Both `admin` and `editor` addresses are set during initialization
- **Numeric Values**: Pass as strings in JSON to handle large numbers correctly
- **Boolean Values**: Use `true` or `false` (without quotes)
- **Access Control**: The contract does NOT use Ownable - it uses role-based access control
- **Initial Minting**: Only happens if `mintInitialNfts` is `true` and requires deployer to have minting permissions
- **Upgradeable**: This is a UUPS upgradeable contract deployed behind an ERC1967 proxy

## Deployment Process

1. **Implementation**: Deploys the EMN contract implementation
2. **Proxy**: Deploys ERC1967 proxy with initialization data
3. **Initialization**: Calls `initialize()` with all 6 parameters
4. **Role Setup**: Admin and Editor roles are automatically assigned
5. **Optional Minting**: Mints initial NFTs if requested

## Security Considerations

- **Admin Address**: Should be a secure multisig or governance contract in production
- **Editor Address**: Can be the same as admin or a separate trusted address
- **Royalty Settings**: Can be modified by editors after deployment
- **Upgrade Authority**: Only admin can authorize contract upgrades 