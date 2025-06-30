"use client";
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { 
  useReadEmnBalanceOf, 
  useReadEmnGetTokenCounter,
  useReadEmnOwner,
  useReadEmnTokenUri,
  useReadEmnOwnerOf,
  useReadEmnContractUri
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
  const { data: contractOwner } = useReadEmnOwner();
  const { data: contractURI } = useReadEmnContractUri();
  
  // Check if current user is the contract owner
  const isOwner = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase();
  
  // Generate array of token IDs from 0 to tokenCounter-1
  const tokenIds = tokenCounter ? Array.from({ length: Number(tokenCounter) }, (_, i) => i) : [];

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
            <p className="text-green-100">You are the contract owner and can mint new tokens.</p>
            <div className="card-actions mt-3">
              <Link href="/nfts/emn/mint" className="btn bg-white text-green-600 hover:bg-gray-100 border-0">
                Mint New Token
              </Link>
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