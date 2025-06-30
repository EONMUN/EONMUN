"use client";
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Arweave from 'arweave';
import { 
  useReadEmnTokenUri,
  useReadEmnOwnerOf,
  useReadEmnOwner,
  useWriteEmnSetTokenUri,
  useSimulateEmnSetTokenUri
} from "@/abis";

// Initialize Arweave
const arweave = Arweave.init({});

interface TokenMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

interface TokenPageProps {
  params: Promise<{ tokenId: string }>;
}

export default function TokenPage({ params }: TokenPageProps) {
  const resolvedParams = use(params);
  const { tokenId } = resolvedParams;
  const tokenIdNum = parseInt(tokenId);
  const { address, isConnected } = useAccount();
  
  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [newUri, setNewUri] = useState('');
  const [txPending, setTxPending] = useState(false);
  
  // State for Arweave image and metadata
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);

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

  // Function to extract Arweave transaction ID from various formats
  const extractArweaveId = (uri: string): string | null => {
    if (!uri) return null;
    
    // Handle different URI formats:
    // 1. ar:// protocol format
    if (uri.startsWith('ar://')) {
      return uri.substring(5); // Remove 'ar://' prefix
    }
    
    // 2. Direct Arweave transaction ID
    if (uri.match(/^[a-zA-Z0-9_-]{43}$/)) {
      return uri;
    }
    
    // 3. Full Arweave URL (https://arweave.net/TRANSACTION_ID)
    const arweaveUrlMatch = uri.match(/https?:\/\/arweave\.net\/([a-zA-Z0-9_-]{43})/);
    if (arweaveUrlMatch) {
      return arweaveUrlMatch[1];
    }
    
    // 4. Gateway URL (https://GATEWAY/TRANSACTION_ID)
    const gatewayMatch = uri.match(/https?:\/\/[^\/]+\/([a-zA-Z0-9_-]{43})/);
    if (gatewayMatch) {
      return gatewayMatch[1];
    }
    
    return null;
  };

  // Function to parse JSON metadata from tokenURI
  const parseTokenMetadata = (uri: string): { imageUri: string | null, metadata: TokenMetadata | null } => {
    if (!uri) return { imageUri: null, metadata: null };
    
    try {
      // Handle data URL format: data:application/json;utf8,{...}
      let jsonStr = uri;
      if (uri.startsWith('data:application/json;utf8,')) {
        jsonStr = uri.substring('data:application/json;utf8,'.length);
      } else if (uri.startsWith('data:application/json,')) {
        jsonStr = uri.substring('data:application/json,'.length);
      }
      
      const metadata: TokenMetadata = JSON.parse(jsonStr);
      const imageUri = metadata.image || null;
      
      return { imageUri, metadata };
    } catch (err) {
      console.error('Failed to parse token metadata:', err);
      // If it's not JSON, treat the entire URI as the image URI
      return { imageUri: uri, metadata: null };
    }
  };

  // Function to fetch image from Arweave
  const fetchArweaveImage = async (transactionId: string) => {
    console.log('Fetching image from Arweave:', transactionId);
    try {
      setImageLoading(true);
      setImageError(null);
      
      // Get the data URL directly from Arweave API
      const res = await arweave.api.get(transactionId);
      console.log('Data:', res);
      
      // Use the URL directly
      const imageUrl = res.url;
      setImageData(imageUrl);
      
    } catch (err) {
      console.error('Failed to fetch Arweave data:', err);
      setImageError('Failed to load image from Arweave');
    } finally {
      setImageLoading(false);
    }
  };

  // Effect to parse metadata and fetch image when tokenURI changes
  useEffect(() => {
    if (tokenURI) {
      const { imageUri, metadata: parsedMetadata } = parseTokenMetadata(tokenURI);
      setMetadata(parsedMetadata);
      
      if (imageUri) {
        const arweaveId = extractArweaveId(imageUri);
        if (arweaveId) {
          fetchArweaveImage(arweaveId);
        } else {
          setImageData(null);
          setImageError('Image URI does not contain a valid Arweave transaction ID');
        }
      } else {
        setImageData(null);
        setImageError('No image found in metadata');
      }
    } else {
      setImageData(null);
      setImageError(null);
      setMetadata(null);
    }
  }, [tokenURI]);

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

    console.log('imageData', imageData);
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {metadata?.name || `Token #${tokenId}`}
              </h1>
              {metadata?.name && (
                <p className="text-lg text-gray-600 mt-1">Token #{tokenId}</p>
              )}
              {metadata?.description && (
                <p className="text-gray-700 mt-2 max-w-2xl">{metadata.description}</p>
              )}
            </div>
            
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
            {/* Image Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Token Image</h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                {imageLoading ? (
                  <div className="aspect-square flex items-center justify-center bg-gray-100">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="loading loading-spinner loading-lg text-blue-600"></div>
                      <span className="text-sm text-gray-600">Loading image from Arweave...</span>
                    </div>
                  </div>
                ) : imageError ? (
                  <div className="aspect-square flex items-center justify-center bg-red-50 text-red-600 p-4">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-sm font-medium">{imageError}</p>
                    </div>
                  </div>
                ) : imageData ? (
                  <div className="aspect-square">
                    <img 
                      src={imageData} 
                      alt={metadata?.name || `Token ${tokenId}`}
                      className="w-full h-full object-cover"
                      onError={() => setImageError('Failed to display image')}
                    />
                  </div>
                ) : (
                  <div className="aspect-square flex items-center justify-center bg-gray-100 text-gray-500">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">No image available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Token URI and Information Section */}
            <div className="space-y-4">
              {/* Metadata Section */}
              {metadata && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Metadata</h3>
                  <div className="space-y-2">
                    {metadata.name && (
                      <div>
                        <span className="text-sm font-medium text-blue-700">Name:</span>
                        <span className="text-sm text-blue-800 ml-2">{metadata.name}</span>
                      </div>
                    )}
                    {metadata.description && (
                      <div>
                        <span className="text-sm font-medium text-blue-700">Description:</span>
                        <span className="text-sm text-blue-800 ml-2">{metadata.description}</span>
                      </div>
                    )}
                    {metadata.external_url && (
                      <div>
                        <span className="text-sm font-medium text-blue-700">External URL:</span>
                        <a 
                          href={metadata.external_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline ml-2"
                        >
                          {metadata.external_url}
                        </a>
                      </div>
                    )}
                    {metadata.attributes && metadata.attributes.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-blue-700">Attributes:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {metadata.attributes.map((attr, index) => (
                            <span 
                              key={index}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {attr.trait_type}: {attr.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                    placeholder="Enter new token URI (Arweave transaction ID or URL)..."
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
                  {tokenURI && (
                    <div className="mt-3 flex gap-2">
                      {tokenURI.startsWith('http') && (
                        <a 
                          href={tokenURI} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 border-0"
                        >
                          View Metadata →
                        </a>
                      )}
                      {extractArweaveId(tokenURI) && (
                        <a 
                          href={`https://arweave.net/${extractArweaveId(tokenURI)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-sm bg-purple-600 text-white hover:bg-purple-700 border-0"
                        >
                          View on Arweave →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Token Info Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Token Information</h3>
                
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
