"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { 
  useReadEmnTokenUri,
  useReadEmnOwnerOf,
  useReadEmnOwner,
  useWriteEmnSetTokenUri,
  useSimulateEmnSetTokenUri
} from "@/abis";

interface TokenPageProps {
  params: { tokenId: string };
}

export default function TokenPage({ params }: TokenPageProps) {
  const { tokenId } = params;
  const tokenIdNum = parseInt(tokenId);
  const { address, isConnected } = useAccount();
  
  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [newUri, setNewUri] = useState('');
  const [txPending, setTxPending] = useState(false);

  // Contract reads
  const { data: tokenURI, isLoading: uriLoading, refetch: refetchUri } = useReadEmnTokenUri({
    args: [BigInt(tokenIdNum)],
  });
  
  const { data: tokenOwner } = useReadEmnOwnerOf({
    args: [BigInt(tokenIdNum)],
  });
  
  const { data: contractOwner } = useReadEmnOwner();
  
  // Check if current user is the contract owner
  const isContractOwner = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase();
  
  // Contract writes for editing URI
  const { data: simulateData } = useSimulateEmnSetTokenUri({
    args: [BigInt(tokenIdNum), newUri],
    query: {
      enabled: isEditing && newUri.length > 0 && isContractOwner,
    },
  });
  
  const { writeContract, isPending, error } = useWriteEmnSetTokenUri();

  // Initialize edit form with current URI
  useEffect(() => {
    if (tokenURI && isEditing) {
      setNewUri(tokenURI);
    }
  }, [tokenURI, isEditing]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setNewUri(tokenURI || '');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewUri('');
  };

  const handleSaveEdit = async () => {
    if (!simulateData?.request || !writeContract) return;
    
    try {
      setTxPending(true);
      await writeContract(simulateData.request);
      
      // Wait a moment then refetch
      setTimeout(() => {
        refetchUri();
        setIsEditing(false);
        setNewUri('');
        setTxPending(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to update token URI:', err);
      setTxPending(false);
    }
  };

  if (isNaN(tokenIdNum)) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <span>Invalid token ID: {tokenId}</span>
        </div>
        <Link href="/nfts/emn" className="btn bg-blue-600 text-white hover:bg-blue-700 border-0 mt-4">
          Back to Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Navigation */}
      <div className="text-sm">
        <ul className="flex items-center space-x-2 text-gray-600">
          <li><Link href="/nfts/emn" className="text-blue-600 hover:text-blue-800">EMN Collection</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900">Token #{tokenId}</li>
        </ul>
      </div>

      {/* Token Details */}
      <div className="card bg-white shadow-lg border border-gray-200">
        <div className="card-body">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Token #{tokenId}</h1>
            
            {/* Owner Controls */}
            {isConnected && isContractOwner && !isEditing && (
              <button 
                onClick={handleStartEdit}
                className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 border-0"
              >
                Edit URI
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Token URI Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Token URI</h2>
              
              {uriLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              ) : isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={newUri}
                    onChange={(e) => setNewUri(e.target.value)}
                    className="w-full h-24 text-sm font-mono p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder="Enter new token URI..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={txPending || isPending || !newUri.trim() || newUri === tokenURI}
                      className="btn btn-sm bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:text-gray-200 border-0"
                    >
                      {txPending || isPending ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={txPending || isPending}
                      className="btn btn-sm bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-300 border-0"
                    >
                      Cancel
                    </button>
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">
                      <span className="text-sm">Error: {error.message}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <div className="text-sm font-mono text-gray-800 break-all">
                    {tokenURI || 'No URI set'}
                  </div>
                  {tokenURI && tokenURI.startsWith('http') && (
                    <div className="mt-3">
                      <a 
                        href={tokenURI} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 border-0"
                      >
                        View Metadata →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Token Info Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Token Information</h2>
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <div className="text-sm text-gray-600 font-medium">Token ID</div>
                  <div className="text-lg font-bold text-gray-900">{tokenId}</div>
                </div>
                
                <div className="p-4 border-b border-gray-200">
                  <div className="text-sm text-gray-600 font-medium">Owner</div>
                  <div className="text-sm font-mono text-gray-900">
                    {tokenOwner ? (
                      `${tokenOwner.substring(0, 6)}...${tokenOwner.substring(tokenOwner.length - 4)}`
                    ) : (
                      'Loading...'
                    )}
                  </div>
                  {tokenOwner && (
                    <div className="text-xs text-gray-500 break-all mt-1">{tokenOwner}</div>
                  )}
                </div>

                {contractOwner && (
                  <div className="p-4">
                    <div className="text-sm text-gray-600 font-medium">Contract Owner</div>
                    <div className="text-sm font-mono text-gray-900">
                      {`${contractOwner.substring(0, 6)}...${contractOwner.substring(contractOwner.length - 4)}`}
                    </div>
                    {isContractOwner && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        ✓ You own this contract
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href="/nfts/emn" className="btn bg-white text-gray-700 hover:bg-gray-50 border border-gray-300">
          ← Back to Collection
        </Link>
        
        {tokenIdNum > 0 && (
          <Link href={`/nfts/emn/${tokenIdNum - 1}`} className="btn bg-white text-gray-700 hover:bg-gray-50 border border-gray-300">
            ← Previous Token
          </Link>
        )}
        
        <Link href={`/nfts/emn/${tokenIdNum + 1}`} className="btn bg-white text-gray-700 hover:bg-gray-50 border border-gray-300">
          Next Token →
        </Link>
      </div>
    </div>
  );
}
