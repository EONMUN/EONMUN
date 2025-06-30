"use client";
import { useAccount, useConfig } from "wagmi";
import { useReadEmnBalanceOf, useReadEmnVersion, useReadEmnRoyaltyInfo, useReadEmnGetTokenCounter, useReadEmnTokenUri, useReadEmnOwnerOf } from "@/abis";

// Component to display individual token info
function TokenInfo({ tokenId }: { tokenId: number }) {
  const { data: tokenURI, isLoading: uriLoading, error: uriError } = useReadEmnTokenUri({
    args: [BigInt(tokenId)],
  });
  
  const { data: owner } = useReadEmnOwnerOf({
    args: [BigInt(tokenId)],
  });

  if (uriLoading) {
    return (
      <div className="card bg-base-100 shadow-md p-4 animate-pulse">
        <div className="h-4 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      </div>
    );
  }

  if (uriError) {
    return (
      <div className="card bg-error text-error-content shadow-md p-4">
        <h3 className="font-bold text-white">Token #{tokenId}</h3>
        <p className="text-sm text-white">Error loading token: {uriError.message}</p>
      </div>
    );
  }

  return (
    <div className="card bg-white shadow-md border border-gray-200">
      <div className="card-body p-4">
        <h3 className="card-title text-lg text-gray-900">Token #{tokenId}</h3>
        
        <div className="space-y-3">
          <div>
            <span className="font-semibold text-sm text-gray-700">Token URI:</span>
            <div className="bg-gray-50 border border-gray-200 p-3 rounded text-xs break-all font-mono text-gray-800 mt-1">
              {tokenURI || 'No URI set'}
            </div>
          </div>
          
          {owner && (
            <div>
              <span className="font-semibold text-sm text-gray-700">Owner:</span>
              <div className="bg-gray-50 border border-gray-200 p-3 rounded text-xs break-all font-mono text-gray-800 mt-1">
                {owner}
              </div>
            </div>
          )}
          
          {tokenURI?.startsWith('http') && (
            <div className="pt-2">
              <a 
                href={tokenURI} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-sm btn-primary text-white"
              >
                View Metadata →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TestPage() {
  const config = useConfig();
  const { address } = useAccount();
  const { data: upgradeInterfaceVersion } = useReadEmnVersion();
  const { data: royaltyInfo } = useReadEmnRoyaltyInfo();
  const { data: balanceOf } = useReadEmnBalanceOf();
  const { data: tokenCounter, isLoading: counterLoading, error: counterError } = useReadEmnGetTokenCounter();

  // Generate array of token IDs from 0 to tokenCounter-1
  const tokenIds = tokenCounter ? Array.from({ length: Number(tokenCounter) }, (_, i) => i) : [];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="card bg-primary text-primary-content">
        <div className="card-body">
          <h1 className="card-title text-2xl">EMN Contract Test Page</h1>
          <p>Connected Address: {address || 'Not connected'}</p>
          <p>Chain ID: {config.state.chainId}</p>
        </div>
      </div>

      {/* Contract Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Version</div>
          <div className="stat-value text-sm">{upgradeInterfaceVersion || 'Loading...'}</div>
        </div>
        
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Your Balance</div>
          <div className="stat-value text-sm">{balanceOf?.toString() || '0'}</div>
        </div>
        
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Total Tokens</div>
          <div className="stat-value text-sm">
            {counterLoading ? 'Loading...' : tokenCounter?.toString() || '0'}
          </div>
        </div>
        
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Royalty Info</div>
          <div className="stat-value text-xs">{royaltyInfo ? 'Set' : 'None'}</div>
        </div>
      </div>

      {/* Token Collection */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Token Collection</h2>
          
          {counterError && (
            <div className="alert alert-error">
              <span>Error loading token counter: {counterError.message}</span>
            </div>
          )}
          
          {counterLoading && (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
              <span className="ml-2">Loading token counter...</span>
            </div>
          )}
          
          {tokenCounter && Number(tokenCounter) === 0 && (
            <div className="alert alert-info">
              <span>No tokens have been minted yet.</span>
            </div>
          )}
          
          {tokenIds.length > 0 && (
            <>
              <div className="mb-4">
                <p className="text-sm opacity-70">
                  Showing {tokenIds.length} token{tokenIds.length !== 1 ? 's' : ''} in the collection
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tokenIds.map((tokenId) => (
                  <TokenInfo key={tokenId} tokenId={tokenId} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}