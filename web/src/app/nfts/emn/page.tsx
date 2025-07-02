"use client";
import Link from 'next/link';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { 
  useReadEmnBalanceOf, 
  useReadEmnGetTokenCounter,
  useReadEmnOwner,
  useReadEmnTokenUri,
  useReadEmnOwnerOf,
  useReadEmnContractUri,
  useWriteEmnTransferOwnership,
  useSimulateEmnTransferOwnership,
  useWriteEmnSetDefaultRoyalty,
  useSimulateEmnSetDefaultRoyalty
} from "@/abis";

// Component to display individual token card
function TokenCard({ tokenId }: { tokenId: number }) {
  const { data: tokenURI, isLoading: uriLoading } = useReadEmnTokenUri({
    args: [BigInt(tokenId)],
  });
  
  const { data: owner } = useReadEmnOwnerOf({
    args: [BigInt(tokenId)],
  });

  if (uriLoading) {
    return (
      <Link href={`/nfts/emn/${tokenId}`}>
        <div className="card bg-white shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="card-body p-4 animate-pulse">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/nfts/emn/${tokenId}`}>
      <div className="card bg-white shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="card-body p-4">
          <h3 className="card-title text-lg text-gray-900">Token #{tokenId}</h3>
          
          <div className="space-y-2">
            <div>
              <span className="font-semibold text-xs text-gray-600">URI:</span>
              <div className="bg-gray-50 p-2 rounded text-xs break-all font-mono text-gray-700 mt-1">
                {tokenURI ? (
                  tokenURI.length > 50 ? `${tokenURI.substring(0, 50)}...` : tokenURI
                ) : (
                  'No URI set'
                )}
              </div>
            </div>
            
            {owner && (
              <div>
                <span className="font-semibold text-xs text-gray-600">Owner:</span>
                <div className="bg-gray-50 p-2 rounded text-xs break-all font-mono text-gray-700 mt-1">
                  {`${owner.substring(0, 6)}...${owner.substring(owner.length - 4)}`}
                </div>
              </div>
            )}
          </div>
          
          <div className="card-actions justify-end mt-3">
            <span className="text-xs text-blue-600">Click to view details →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function EMNPage() {
  const { address, isConnected } = useAccount();
  const { data: balanceOf } = useReadEmnBalanceOf();
  const { data: tokenCounter, isLoading: counterLoading } = useReadEmnGetTokenCounter();
  const { data: contractOwner, refetch: refetchOwner } = useReadEmnOwner();
  const { data: contractURI } = useReadEmnContractUri();
  
  // State for ownership transfer
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [newOwnerAddress, setNewOwnerAddress] = useState('');
  const [transferPending, setTransferPending] = useState(false);
  
  // State for default royalty management
  const [showDefaultRoyaltyForm, setShowDefaultRoyaltyForm] = useState(false);
  const [defaultRoyaltyReceiver, setDefaultRoyaltyReceiver] = useState('');
  const [defaultRoyaltyPercentage, setDefaultRoyaltyPercentage] = useState('');
  const [defaultRoyaltyPending, setDefaultRoyaltyPending] = useState(false);
  
  // Check if current user is the contract owner
  const isOwner = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase();
  
  // Ownership transfer hooks
  const { data: simulateTransferData } = useSimulateEmnTransferOwnership({
    args: [newOwnerAddress as `0x${string}`],
    query: {
      enabled: showTransferForm && newOwnerAddress.length === 42 && newOwnerAddress.startsWith('0x'),
    },
  });
  
  const { writeContract: transferOwnership, isPending: isTransferPending, error: transferError } = useWriteEmnTransferOwnership();
  
  // Default royalty hooks
  const defaultRoyaltyFeeNumerator = defaultRoyaltyPercentage ? Math.floor(parseFloat(defaultRoyaltyPercentage) * 100) : 0; // Convert percentage to basis points
  const { data: simulateDefaultRoyaltyData } = useSimulateEmnSetDefaultRoyalty({
    args: [
      defaultRoyaltyReceiver as `0x${string}`,
      BigInt(defaultRoyaltyFeeNumerator)
    ],
    query: {
      enabled: showDefaultRoyaltyForm && 
               defaultRoyaltyReceiver.length === 42 && 
               defaultRoyaltyReceiver.startsWith('0x') &&
               defaultRoyaltyPercentage && 
               !isNaN(parseFloat(defaultRoyaltyPercentage)) &&
               parseFloat(defaultRoyaltyPercentage) >= 0 &&
               parseFloat(defaultRoyaltyPercentage) <= 100,
    },
  });
  
  const { writeContract: setDefaultRoyalty, isPending: isDefaultRoyaltyPending, error: defaultRoyaltyError } = useWriteEmnSetDefaultRoyalty();
  
  // Generate array of token IDs from 0 to tokenCounter-1
  const tokenIds = tokenCounter ? Array.from({ length: Number(tokenCounter) }, (_, i) => i) : [];

  const handleStartTransfer = () => {
    setShowTransferForm(true);
    setNewOwnerAddress('');
  };

  const handleCancelTransfer = () => {
    setShowTransferForm(false);
    setNewOwnerAddress('');
  };

  const handleTransferOwnership = async () => {
    if (!simulateTransferData?.request || !transferOwnership) return;
    
    try {
      setTransferPending(true);
      await transferOwnership(simulateTransferData.request);
      
      // Wait a moment then refetch owner data
      setTimeout(() => {
        refetchOwner();
        setShowTransferForm(false);
        setNewOwnerAddress('');
        setTransferPending(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to transfer ownership:', err);
      setTransferPending(false);
    }
  };

  const handleStartDefaultRoyalty = () => {
    setShowDefaultRoyaltyForm(true);
    setDefaultRoyaltyReceiver('');
    setDefaultRoyaltyPercentage('');
  };

  const handleCancelDefaultRoyalty = () => {
    setShowDefaultRoyaltyForm(false);
    setDefaultRoyaltyReceiver('');
    setDefaultRoyaltyPercentage('');
  };

  const handleSetDefaultRoyalty = async () => {
    if (!simulateDefaultRoyaltyData?.request || !setDefaultRoyalty) return;
    
    try {
      setDefaultRoyaltyPending(true);
      await setDefaultRoyalty(simulateDefaultRoyaltyData.request);
      
      // Wait a moment then reset form
      setTimeout(() => {
        setShowDefaultRoyaltyForm(false);
        setDefaultRoyaltyReceiver('');
        setDefaultRoyaltyPercentage('');
        setDefaultRoyaltyPending(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to set default royalty:', err);
      setDefaultRoyaltyPending(false);
    }
  };

  const isValidAddress = (addr: string) => {
    return addr.length === 42 && addr.startsWith('0x') && /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const isValidPercentage = (percentage: string) => {
    const pct = parseFloat(percentage);
    return !isNaN(pct) && pct >= 0 && pct <= 100;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="card bg-blue-600 text-white shadow-lg">
        <div className="card-body">
          <h1 className="text-3xl font-bold">EMN NFT Collection</h1>
          <div className="bg-white rounded-lg p-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 font-medium">Total Tokens</div>
                <div className="text-2xl font-bold text-gray-900">
                  {counterLoading ? '...' : tokenCounter?.toString() || '0'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 font-medium">Your Balance</div>
                <div className="text-2xl font-bold text-gray-900">{balanceOf?.toString() || '0'}</div>
              </div>
              {contractOwner && (
                <div className="text-center">
                  <div className="text-sm text-gray-600 font-medium">Contract Owner</div>
                  <div className="text-lg font-bold text-gray-900">
                    {`${contractOwner.substring(0, 6)}...${contractOwner.substring(contractOwner.length - 4)}`}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Contract URI Section */}
          {contractURI && (
            <div className="bg-white rounded-lg p-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contract URI</h3>
              <div className="bg-gray-50 border border-gray-200 p-3 rounded text-sm font-mono text-gray-800 break-all">
                {contractURI}
              </div>
              {contractURI.startsWith('http') && (
                <div className="mt-3">
                  <a 
                    href={contractURI} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 border-0"
                  >
                    View Contract Metadata →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Owner Controls */}
      {isConnected && isOwner && (
        <div className="card bg-green-600 text-white shadow-lg">
          <div className="card-body">
            <h2 className="text-xl font-bold">Owner Controls</h2>
            <p className="text-green-100">You are the contract owner and can mint new tokens and transfer ownership.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Minting Section */}
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Minting</h3>
                <div className="card-actions">
                  <Link href="/nfts/emn/mint" className="btn bg-white text-green-600 hover:bg-gray-100 border-0">
                    Mint New Token
                  </Link>
                </div>
              </div>

              {/* Default Royalty Section */}
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Default Royalty</h3>
                {!showDefaultRoyaltyForm ? (
                  <div className="space-y-2">
                    <p className="text-green-100 text-sm">Set default royalty for all tokens.</p>
                    <button
                      onClick={handleStartDefaultRoyalty}
                      className="btn bg-purple-600 text-white hover:bg-purple-700 border-0"
                    >
                      Set Default Royalty
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-gray-900 text-sm font-medium mb-1 block">Royalty Receiver Address</label>
                      <input
                        type="text"
                        value={defaultRoyaltyReceiver}
                        onChange={(e) => setDefaultRoyaltyReceiver(e.target.value)}
                        placeholder="0x..."
                        className="w-full text-sm font-mono p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                      />
                      {defaultRoyaltyReceiver && !isValidAddress(defaultRoyaltyReceiver) && (
                        <p className="text-red-800 text-xs mt-1 bg-red-100 px-2 py-1 rounded">Please enter a valid Ethereum address</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-gray-900 text-sm font-medium mb-1 block">Default Royalty Percentage (%)</label>
                      <input
                        type="number"
                        value={defaultRoyaltyPercentage}
                        onChange={(e) => setDefaultRoyaltyPercentage(e.target.value)}
                        placeholder="2.5"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                      />
                      {defaultRoyaltyPercentage && !isValidPercentage(defaultRoyaltyPercentage) && (
                        <p className="text-red-800 text-xs mt-1 bg-red-100 px-2 py-1 rounded">Please enter a percentage between 0 and 100</p>
                      )}
                      <p className="text-gray-700 text-xs mt-1">Applies to all tokens without specific royalty set</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleSetDefaultRoyalty}
                        disabled={
                          defaultRoyaltyPending || 
                          isDefaultRoyaltyPending || 
                          !isValidAddress(defaultRoyaltyReceiver) ||
                          !isValidPercentage(defaultRoyaltyPercentage)
                        }
                        className="btn btn-sm bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:text-gray-200 border-0"
                      >
                        {defaultRoyaltyPending || isDefaultRoyaltyPending ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Setting...
                          </>
                        ) : (
                          'Set Default Royalty'
                        )}
                      </button>
                      <button
                        onClick={handleCancelDefaultRoyalty}
                        disabled={defaultRoyaltyPending || isDefaultRoyaltyPending}
                        className="btn btn-sm bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-300 border-0"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    {defaultRoyaltyError && (
                      <div className="bg-red-100 border border-red-400 text-red-800 rounded p-2">
                        <span className="text-xs">Error: {defaultRoyaltyError.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Ownership Transfer Section */}
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Ownership Transfer</h3>
                {!showTransferForm ? (
                  <div className="space-y-2">
                    <p className="text-green-100 text-sm">Transfer contract ownership to another address.</p>
                    <button
                      onClick={handleStartTransfer}
                      className="btn bg-yellow-600 text-white hover:bg-yellow-700 border-0"
                    >
                      Transfer Ownership
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-gray-900 text-sm font-medium mb-1 block">New Owner Address</label>
                      <input
                        type="text"
                        value={newOwnerAddress}
                        onChange={(e) => setNewOwnerAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full text-sm font-mono p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 bg-white"
                      />
                      {newOwnerAddress && !isValidAddress(newOwnerAddress) && (
                        <p className="text-red-800 text-xs mt-1 bg-red-100 px-2 py-1 rounded">Please enter a valid Ethereum address</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleTransferOwnership}
                        disabled={
                          transferPending || 
                          isTransferPending || 
                          !isValidAddress(newOwnerAddress) ||
                          newOwnerAddress.toLowerCase() === address?.toLowerCase()
                        }
                        className="btn btn-sm bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:text-gray-200 border-0"
                      >
                        {transferPending || isTransferPending ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Transferring...
                          </>
                        ) : (
                          'Confirm Transfer'
                        )}
                      </button>
                      <button
                        onClick={handleCancelTransfer}
                        disabled={transferPending || isTransferPending}
                        className="btn btn-sm bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-300 border-0"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    {newOwnerAddress.toLowerCase() === address?.toLowerCase() && (
                      <p className="text-yellow-800 text-xs bg-yellow-100 px-2 py-1 rounded">Cannot transfer to the same address</p>
                    )}
                    
                    {transferError && (
                      <div className="bg-red-100 border border-red-400 text-red-800 rounded p-2">
                        <span className="text-xs">Error: {transferError.message}</span>
                      </div>
                    )}
                    
                    <div className="bg-red-100 border border-red-400 text-red-800 rounded p-2">
                      <p className="text-xs">
                        ⚠️ <strong>Warning:</strong> This action is irreversible. You will permanently lose control of this contract.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Token Collection */}
      <div className="card bg-white shadow-lg border border-gray-200">
        <div className="card-body">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Token Collection</h2>
          
          {counterLoading && (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
              <span className="ml-2 text-gray-700">Loading tokens...</span>
            </div>
          )}
          
          {tokenCounter && Number(tokenCounter) === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-blue-500 shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div className="flex-1">
                <span className="text-blue-800">No tokens have been minted yet.</span>
                {isOwner && (
                  <div className="mt-2">
                    <Link href="/nfts/emn/mint" className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 border-0">
                      Mint First Token
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {tokenIds.length > 0 && (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Showing {tokenIds.length} token{tokenIds.length !== 1 ? 's' : ''} in the collection. Click on any token to view details.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tokenIds.map((tokenId) => (
                  <TokenCard key={tokenId} tokenId={tokenId} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}