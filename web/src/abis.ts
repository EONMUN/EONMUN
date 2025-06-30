import {
  createReadContract,
  createWriteContract,
  createSimulateContract,
  createWatchContractEvent,
} from 'wagmi/codegen'

import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EMN
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const emnAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [
      { name: 'implementation', internalType: 'address', type: 'address' },
    ],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  {
    type: 'error',
    inputs: [
      { name: 'numerator', internalType: 'uint256', type: 'uint256' },
      { name: 'denominator', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC2981InvalidDefaultRoyalty',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC2981InvalidDefaultRoyaltyReceiver',
  },
  {
    type: 'error',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'numerator', internalType: 'uint256', type: 'uint256' },
      { name: 'denominator', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC2981InvalidTokenRoyalty',
  },
  {
    type: 'error',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'receiver', internalType: 'address', type: 'address' },
    ],
    name: 'ERC2981InvalidTokenRoyaltyReceiver',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'owner', internalType: 'address', type: 'address' },
    ],
    name: 'ERC721IncorrectOwner',
  },
  {
    type: 'error',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC721InsufficientApproval',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC721InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'operator', internalType: 'address', type: 'address' }],
    name: 'ERC721InvalidOperator',
  },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'ERC721InvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC721InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC721InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'ERC721NonexistentToken',
  },
  { type: 'error', inputs: [], name: 'FailedCall' },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'UUPSUnauthorizedCallContext' },
  {
    type: 'error',
    inputs: [{ name: 'slot', internalType: 'bytes32', type: 'bytes32' }],
    name: 'UUPSUnsupportedProxiableUUID',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'approved',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'approved', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'ApprovalForAll',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'version',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'tokenURI',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'NftMinted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'implementation',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'Upgraded',
  },
  {
    type: 'function',
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'contractURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'deleteDefaultRoyalty',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getTokenCounter',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'royaltyReceiver', internalType: 'address', type: 'address' },
      { name: 'royaltyFeeNumerator', internalType: 'uint96', type: 'uint96' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'operator', internalType: 'address', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenURI', internalType: 'string', type: 'string' }],
    name: 'mintNft',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenURI', internalType: 'string', type: 'string' },
    ],
    name: 'mintNftTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'resetTokenRoyalty',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'salePrice', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'royaltyInfo',
    outputs: [
      { name: 'receiver', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'approved', internalType: 'bool', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'receiver', internalType: 'address', type: 'address' },
      { name: 'feeNumerator', internalType: 'uint96', type: 'uint96' },
    ],
    name: 'setDefaultRoyalty',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'receiver', internalType: 'address', type: 'address' },
      { name: 'feeNumerator', internalType: 'uint96', type: 'uint96' },
    ],
    name: 'setTokenRoyalty',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'tokenURI', internalType: 'string', type: 'string' },
    ],
    name: 'setTokenURI',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'version',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
] as const

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const emnAddress = {
  11155111: '0x2E650Bc3C306018bFD3a652D704d07d07A46067a',
} as const

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const emnConfig = { address: emnAddress, abi: emnAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC1967ProxyWrapper
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc1967ProxyWrapperAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'implementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [
      { name: 'implementation', internalType: 'address', type: 'address' },
    ],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  { type: 'error', inputs: [], name: 'FailedCall' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'implementation',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'Upgraded',
  },
  { type: 'fallback', stateMutability: 'payable' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmn = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnUpgradeInterfaceVersion = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'UPGRADE_INTERFACE_VERSION',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"balanceOf"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnBalanceOf = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"contractURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnContractUri = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'contractURI',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"getApproved"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnGetApproved = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'getApproved',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"getTokenCounter"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnGetTokenCounter = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'getTokenCounter',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"isApprovedForAll"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnIsApprovedForAll = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'isApprovedForAll',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"name"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnName = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"owner"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnOwner = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"ownerOf"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnOwnerOf = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'ownerOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnProxiableUuid = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"royaltyInfo"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnRoyaltyInfo = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'royaltyInfo',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnSupportsInterface = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"symbol"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnSymbol = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"tokenURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnTokenUri = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'tokenURI',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"version"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const readEmnVersion = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'version',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmn = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnApprove = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"deleteDefaultRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnDeleteDefaultRoyalty = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'deleteDefaultRoyalty',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnInitialize = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNft"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnMintNft = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNft',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNftTo"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnMintNftTo = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNftTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnRenounceOwnership = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"resetTokenRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnResetTokenRoyalty = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'resetTokenRoyalty',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnSafeTransferFrom = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'safeTransferFrom',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnSetApprovalForAll = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setApprovalForAll',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setDefaultRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnSetDefaultRoyalty = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setDefaultRoyalty',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setTokenRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnSetTokenRoyalty = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setTokenRoyalty',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setTokenURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnSetTokenUri = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setTokenURI',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnTransferFrom = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnTransferOwnership = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const writeEmnUpgradeToAndCall = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmn = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnApprove = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"deleteDefaultRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnDeleteDefaultRoyalty =
  /*#__PURE__*/ createSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'deleteDefaultRoyalty',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnInitialize = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNft"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnMintNft = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNft',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNftTo"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnMintNftTo = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNftTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnRenounceOwnership =
  /*#__PURE__*/ createSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"resetTokenRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnResetTokenRoyalty =
  /*#__PURE__*/ createSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'resetTokenRoyalty',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnSafeTransferFrom = /*#__PURE__*/ createSimulateContract(
  { abi: emnAbi, address: emnAddress, functionName: 'safeTransferFrom' },
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnSetApprovalForAll =
  /*#__PURE__*/ createSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setDefaultRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnSetDefaultRoyalty =
  /*#__PURE__*/ createSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'setDefaultRoyalty',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setTokenRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnSetTokenRoyalty = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setTokenRoyalty',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setTokenURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnSetTokenUri = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setTokenURI',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnTransferFrom = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnTransferOwnership =
  /*#__PURE__*/ createSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const simulateEmnUpgradeToAndCall = /*#__PURE__*/ createSimulateContract(
  { abi: emnAbi, address: emnAddress, functionName: 'upgradeToAndCall' },
)

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const watchEmnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Approval"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const watchEmnApprovalEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
  eventName: 'Approval',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"ApprovalForAll"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const watchEmnApprovalForAllEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Initialized"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const watchEmnInitializedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"NftMinted"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const watchEmnNftMintedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
  eventName: 'NftMinted',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const watchEmnOwnershipTransferredEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Transfer"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const watchEmnTransferEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Upgraded"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const watchEmnUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967ProxyWrapperAbi}__
 */
export const watchErc1967ProxyWrapperEvent =
  /*#__PURE__*/ createWatchContractEvent({ abi: erc1967ProxyWrapperAbi })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967ProxyWrapperAbi}__ and `eventName` set to `"Upgraded"`
 */
export const watchErc1967ProxyWrapperUpgradedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: erc1967ProxyWrapperAbi,
    eventName: 'Upgraded',
  })

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmn = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnUpgradeInterfaceVersion =
  /*#__PURE__*/ createUseReadContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'UPGRADE_INTERFACE_VERSION',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"balanceOf"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"contractURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnContractUri = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'contractURI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"getApproved"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnGetApproved = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'getApproved',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"getTokenCounter"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnGetTokenCounter = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'getTokenCounter',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"isApprovedForAll"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnIsApprovedForAll = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'isApprovedForAll',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"name"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnName = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"owner"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnOwner = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"ownerOf"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnOwnerOf = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'ownerOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnProxiableUuid = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"royaltyInfo"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnRoyaltyInfo = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'royaltyInfo',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnSupportsInterface = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"symbol"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnSymbol = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"tokenURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnTokenUri = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'tokenURI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"version"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useReadEmnVersion = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'version',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmn = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnApprove = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"deleteDefaultRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnDeleteDefaultRoyalty =
  /*#__PURE__*/ createUseWriteContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'deleteDefaultRoyalty',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnInitialize = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNft"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnMintNft = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNft',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNftTo"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnMintNftTo = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNftTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"resetTokenRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnResetTokenRoyalty =
  /*#__PURE__*/ createUseWriteContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'resetTokenRoyalty',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnSafeTransferFrom = /*#__PURE__*/ createUseWriteContract(
  { abi: emnAbi, address: emnAddress, functionName: 'safeTransferFrom' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnSetApprovalForAll =
  /*#__PURE__*/ createUseWriteContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setDefaultRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnSetDefaultRoyalty =
  /*#__PURE__*/ createUseWriteContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'setDefaultRoyalty',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setTokenRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnSetTokenRoyalty = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setTokenRoyalty',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setTokenURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnSetTokenUri = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setTokenURI',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWriteEmnUpgradeToAndCall = /*#__PURE__*/ createUseWriteContract(
  { abi: emnAbi, address: emnAddress, functionName: 'upgradeToAndCall' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmn = /*#__PURE__*/ createUseSimulateContract({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"deleteDefaultRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnDeleteDefaultRoyalty =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'deleteDefaultRoyalty',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnInitialize = /*#__PURE__*/ createUseSimulateContract(
  { abi: emnAbi, address: emnAddress, functionName: 'initialize' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNft"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnMintNft = /*#__PURE__*/ createUseSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNft',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNftTo"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnMintNftTo = /*#__PURE__*/ createUseSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNftTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"resetTokenRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnResetTokenRoyalty =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'resetTokenRoyalty',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnSafeTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnSetApprovalForAll =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setDefaultRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnSetDefaultRoyalty =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'setDefaultRoyalty',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setTokenRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnSetTokenRoyalty =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'setTokenRoyalty',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setTokenURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnSetTokenUri =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'setTokenURI',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useSimulateEmnUpgradeToAndCall =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWatchEmnEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Approval"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWatchEmnApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"ApprovalForAll"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWatchEmnApprovalForAllEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Initialized"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWatchEmnInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'Initialized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"NftMinted"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWatchEmnNftMintedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'NftMinted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWatchEmnOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Transfer"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWatchEmnTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Upgraded"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x2E650Bc3C306018bFD3a652D704d07d07A46067a)
 */
export const useWatchEmnUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'Upgraded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967ProxyWrapperAbi}__
 */
export const useWatchErc1967ProxyWrapperEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: erc1967ProxyWrapperAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967ProxyWrapperAbi}__ and `eventName` set to `"Upgraded"`
 */
export const useWatchErc1967ProxyWrapperUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: erc1967ProxyWrapperAbi,
    eventName: 'Upgraded',
  })
