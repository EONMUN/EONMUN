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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const emnAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  { type: 'error', inputs: [], name: 'AccessControlBadConfirmation' },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'neededRole', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'AccessControlUnauthorizedAccount',
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
        name: 'newContractURI',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'ContractURIUpdated',
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
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'RoleAdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleGranted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleRevoked',
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
    name: 'ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'EDITOR_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
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
    stateMutability: 'view',
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
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
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
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'royaltyReceiver', internalType: 'address', type: 'address' },
      { name: 'royaltyFeeNumerator', internalType: 'uint96', type: 'uint96' },
      { name: 'admin', internalType: 'address', type: 'address' },
      { name: 'editor', internalType: 'address', type: 'address' },
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
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'callerConfirmation', internalType: 'address', type: 'address' },
    ],
    name: 'renounceRole',
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
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'revokeRole',
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
      { name: 'newContractURI', internalType: 'string', type: 'string' },
    ],
    name: 'setContractURI',
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const emnAddress = {
  1: '0xF5521D34Bd29f942523a7c125FFe0e06b6D41836',
  11155111: '0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmn = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"ADMIN_ROLE"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnAdminRole = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'ADMIN_ROLE',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnDefaultAdminRole = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'DEFAULT_ADMIN_ROLE',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"EDITOR_ROLE"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnEditorRole = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'EDITOR_ROLE',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnUpgradeInterfaceVersion = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'UPGRADE_INTERFACE_VERSION',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnBalanceOf = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"contractURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnContractUri = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'contractURI',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"getApproved"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnGetApproved = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'getApproved',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"getRoleAdmin"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnGetRoleAdmin = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'getRoleAdmin',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"getTokenCounter"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnGetTokenCounter = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'getTokenCounter',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"hasRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnHasRole = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'hasRole',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"isApprovedForAll"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnIsApprovedForAll = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'isApprovedForAll',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnName = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"ownerOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnOwnerOf = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'ownerOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnProxiableUuid = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"royaltyInfo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnRoyaltyInfo = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'royaltyInfo',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnSupportsInterface = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnSymbol = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"tokenURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnTokenUri = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'tokenURI',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"version"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const readEmnVersion = /*#__PURE__*/ createReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'version',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmn = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnApprove = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"deleteDefaultRoyalty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnDeleteDefaultRoyalty = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'deleteDefaultRoyalty',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"grantRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnGrantRole = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'grantRole',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnInitialize = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNft"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnMintNft = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNft',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNftTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnMintNftTo = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNftTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"renounceRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnRenounceRole = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'renounceRole',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"resetTokenRoyalty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnResetTokenRoyalty = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'resetTokenRoyalty',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"revokeRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnRevokeRole = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'revokeRole',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnSafeTransferFrom = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'safeTransferFrom',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnSetApprovalForAll = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setApprovalForAll',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setContractURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnSetContractUri = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setContractURI',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setDefaultRoyalty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnSetDefaultRoyalty = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setDefaultRoyalty',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setTokenRoyalty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnSetTokenRoyalty = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setTokenRoyalty',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setTokenURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnSetTokenUri = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setTokenURI',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnTransferFrom = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const writeEmnUpgradeToAndCall = /*#__PURE__*/ createWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmn = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnApprove = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"deleteDefaultRoyalty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnDeleteDefaultRoyalty =
  /*#__PURE__*/ createSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'deleteDefaultRoyalty',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"grantRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnGrantRole = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'grantRole',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnInitialize = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNft"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnMintNft = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNft',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNftTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnMintNftTo = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNftTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"renounceRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnRenounceRole = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'renounceRole',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"resetTokenRoyalty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnResetTokenRoyalty =
  /*#__PURE__*/ createSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'resetTokenRoyalty',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"revokeRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnRevokeRole = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'revokeRole',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnSafeTransferFrom = /*#__PURE__*/ createSimulateContract(
  { abi: emnAbi, address: emnAddress, functionName: 'safeTransferFrom' },
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnSetApprovalForAll =
  /*#__PURE__*/ createSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setContractURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnSetContractUri = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setContractURI',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setDefaultRoyalty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnSetTokenRoyalty = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setTokenRoyalty',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setTokenURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnSetTokenUri = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setTokenURI',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnTransferFrom = /*#__PURE__*/ createSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const simulateEmnUpgradeToAndCall = /*#__PURE__*/ createSimulateContract(
  { abi: emnAbi, address: emnAddress, functionName: 'upgradeToAndCall' },
)

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const watchEmnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const watchEmnApprovalEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
  eventName: 'Approval',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"ApprovalForAll"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const watchEmnApprovalForAllEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"ContractURIUpdated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const watchEmnContractUriUpdatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'ContractURIUpdated',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Initialized"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const watchEmnInitializedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"NftMinted"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const watchEmnNftMintedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
  eventName: 'NftMinted',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"RoleAdminChanged"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const watchEmnRoleAdminChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'RoleAdminChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"RoleGranted"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const watchEmnRoleGrantedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
  eventName: 'RoleGranted',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"RoleRevoked"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const watchEmnRoleRevokedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
  eventName: 'RoleRevoked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const watchEmnTransferEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Upgraded"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmn = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"ADMIN_ROLE"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnAdminRole = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'ADMIN_ROLE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnDefaultAdminRole = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'DEFAULT_ADMIN_ROLE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"EDITOR_ROLE"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnEditorRole = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'EDITOR_ROLE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"contractURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnContractUri = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'contractURI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"getApproved"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnGetApproved = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'getApproved',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"getRoleAdmin"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnGetRoleAdmin = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'getRoleAdmin',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"getTokenCounter"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnGetTokenCounter = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'getTokenCounter',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"hasRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnHasRole = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'hasRole',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"isApprovedForAll"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnIsApprovedForAll = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'isApprovedForAll',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnName = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"ownerOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnOwnerOf = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'ownerOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnProxiableUuid = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"royaltyInfo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnRoyaltyInfo = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'royaltyInfo',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnSupportsInterface = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnSymbol = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"tokenURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnTokenUri = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'tokenURI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"version"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useReadEmnVersion = /*#__PURE__*/ createUseReadContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'version',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmn = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnApprove = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"deleteDefaultRoyalty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnDeleteDefaultRoyalty =
  /*#__PURE__*/ createUseWriteContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'deleteDefaultRoyalty',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"grantRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnGrantRole = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'grantRole',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnInitialize = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNft"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnMintNft = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNft',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNftTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnMintNftTo = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNftTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"renounceRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnRenounceRole = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'renounceRole',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"resetTokenRoyalty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnResetTokenRoyalty =
  /*#__PURE__*/ createUseWriteContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'resetTokenRoyalty',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"revokeRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnRevokeRole = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'revokeRole',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnSafeTransferFrom = /*#__PURE__*/ createUseWriteContract(
  { abi: emnAbi, address: emnAddress, functionName: 'safeTransferFrom' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnSetApprovalForAll =
  /*#__PURE__*/ createUseWriteContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setContractURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnSetContractUri = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setContractURI',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setDefaultRoyalty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnSetTokenRoyalty = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setTokenRoyalty',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setTokenURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnSetTokenUri = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'setTokenURI',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWriteEmnUpgradeToAndCall = /*#__PURE__*/ createUseWriteContract(
  { abi: emnAbi, address: emnAddress, functionName: 'upgradeToAndCall' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useSimulateEmn = /*#__PURE__*/ createUseSimulateContract({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useSimulateEmnApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"deleteDefaultRoyalty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useSimulateEmnDeleteDefaultRoyalty =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'deleteDefaultRoyalty',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"grantRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useSimulateEmnGrantRole = /*#__PURE__*/ createUseSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'grantRole',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useSimulateEmnInitialize = /*#__PURE__*/ createUseSimulateContract(
  { abi: emnAbi, address: emnAddress, functionName: 'initialize' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNft"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useSimulateEmnMintNft = /*#__PURE__*/ createUseSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNft',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"mintNftTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useSimulateEmnMintNftTo = /*#__PURE__*/ createUseSimulateContract({
  abi: emnAbi,
  address: emnAddress,
  functionName: 'mintNftTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"renounceRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useSimulateEmnRenounceRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'renounceRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"resetTokenRoyalty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useSimulateEmnResetTokenRoyalty =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'resetTokenRoyalty',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"revokeRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useSimulateEmnRevokeRole = /*#__PURE__*/ createUseSimulateContract(
  { abi: emnAbi, address: emnAddress, functionName: 'revokeRole' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useSimulateEmnSetApprovalForAll =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setContractURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useSimulateEmnSetContractUri =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'setContractURI',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"setDefaultRoyalty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useSimulateEmnTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: emnAbi,
    address: emnAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link emnAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWatchEmnEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: emnAbi,
  address: emnAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWatchEmnApprovalForAllEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"ContractURIUpdated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWatchEmnContractUriUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'ContractURIUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Initialized"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWatchEmnNftMintedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'NftMinted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"RoleAdminChanged"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWatchEmnRoleAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'RoleAdminChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"RoleGranted"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWatchEmnRoleGrantedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'RoleGranted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"RoleRevoked"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
 */
export const useWatchEmnRoleRevokedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: emnAbi,
    address: emnAddress,
    eventName: 'RoleRevoked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link emnAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xF5521D34Bd29f942523a7c125FFe0e06b6D41836)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c)
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
