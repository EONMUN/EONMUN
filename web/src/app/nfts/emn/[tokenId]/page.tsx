"use client";
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { TokenImageWrapper } from '@/components/TokenImage';
import { 
  useReadEmnTokenUri,
  useReadEmnOwnerOf,
  useReadEmnHasRole,
  useReadEmnEditorRole,
  useWriteEmnSetTokenUri,
  useSimulateEmnSetTokenUri,
  useWriteEmnSetTokenRoyalty,
  useSimulateEmnSetTokenRoyalty,
  useReadEmnRoyaltyInfo
} from "@/abis";

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
  
  // Get editor role and check if user has it
  const { data: editorRole } = useReadEmnEditorRole();
  const { data: isEditor } = useReadEmnHasRole({
    args: editorRole && address ? [editorRole, address] : undefined,
    query: { enabled: !!(editorRole && address) }
  });
  
  // Validation functions
  const isValidAddress = (addr: string) => {
    return addr.length === 42 && addr.startsWith('0x') && /^0x[a-fA-F0-9]{40}$/.test(addr);
  };
  
  const isValidPercentage = (percentage: string) => {
    const pct = parseFloat(percentage);
    return !isNaN(pct) && pct >= 0 && pct <= 100;
  };
  
  const isValidURL = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  // State for editing mode and metadata form
  const [isEditing, setIsEditing] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [royaltyPending, setRoyaltyPending] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Current metadata state
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  
  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    external_url: '',
    useCustomRoyalty: false,
    royaltyReceiver: '',
    royaltyPercentage: ''
  });
  
  // Attributes state
  const [attributes, setAttributes] = useState<Array<{ trait_type: string; value: string | number }>>([]);
  const [newAttribute, setNewAttribute] = useState({ trait_type: '', value: '' });

  // Contract reads
  const { data: tokenURI, isLoading: uriLoading, refetch: refetchUri } = useReadEmnTokenUri({
    args: [BigInt(tokenIdNum)],
  });
  
  const { data: tokenOwner } = useReadEmnOwnerOf({
    args: [BigInt(tokenIdNum)],
  });
  
  // Get current token royalty info
  const { data: tokenRoyaltyInfo, isLoading: royaltyLoading } = useReadEmnRoyaltyInfo({
    args: [BigInt(tokenIdNum), BigInt(10000)], // Use 10000 as sample sale price
  });
  
  // Generate metadata URI from form data
  const generateMetadataURI = (): string => {
    const newMetadata: TokenMetadata = {
      name: formData.name,
      description: formData.description,
      image: formData.image,
    };
    
    if (formData.external_url) {
      newMetadata.external_url = formData.external_url;
    }
    
    if (attributes.length > 0) {
      newMetadata.attributes = attributes;
    }
    
    return `data:application/json;utf8,${JSON.stringify(newMetadata)}`;
  };
  
  // Contract writes for editing URI
  const newTokenURI = isEditing ? generateMetadataURI() : '';
  const { data: simulateData } = useSimulateEmnSetTokenUri({
    args: [BigInt(tokenIdNum), newTokenURI],
    query: {
      enabled: isEditing && newTokenURI.length > 0 && isEditor && formData.name.trim() !== '',
    },
  });
  
  const { writeContract, isPending, error } = useWriteEmnSetTokenUri();
  
  // Custom royalty simulation and write
  const royaltyFeeNumerator = formData.royaltyPercentage ? 
    Math.floor(parseFloat(formData.royaltyPercentage) * 100) : 0;
  
  const { data: simulateRoyaltyData } = useSimulateEmnSetTokenRoyalty({
    args: [
      BigInt(tokenIdNum),
      formData.royaltyReceiver as `0x${string}`,
      BigInt(royaltyFeeNumerator)
    ],
    query: {
      enabled: !!(isEditing && 
                 formData.useCustomRoyalty && 
                 isValidAddress(formData.royaltyReceiver) &&
                 isValidPercentage(formData.royaltyPercentage) &&
                 isEditor),
    },
  });
  
  const { writeContract: setTokenRoyalty, error: royaltyError } = useWriteEmnSetTokenRoyalty();

  // Simplified function to parse JSON metadata from tokenURI
  const parseTokenMetadata = (uri: string): TokenMetadata | null => {
    if (!uri) return null;
    
    try {
      // Handle data URL format: data:application/json;utf8,{...}
      let jsonStr = uri;
      if (uri.startsWith('data:application/json;utf8,')) {
        jsonStr = uri.substring('data:application/json;utf8,'.length);
      } else if (uri.startsWith('data:application/json,')) {
        jsonStr = uri.substring('data:application/json,'.length);
      }
      
      const metadata: TokenMetadata = JSON.parse(jsonStr);
      return metadata;
    } catch (err) {
      console.error('Failed to parse token metadata:', err);
      return null;
    }
  };

  // Effect to parse metadata when tokenURI changes
  useEffect(() => {
    if (tokenURI) {
      const parsedMetadata = parseTokenMetadata(tokenURI);
      setMetadata(parsedMetadata);
    } else {
      setMetadata(null);
    }
  }, [tokenURI]);

  // Initialize edit form with current metadata
  useEffect(() => {
    if (metadata && isEditing) {
      setFormData({
        name: metadata.name || '',
        description: metadata.description || '',
        image: metadata.image || '',
        external_url: metadata.external_url || '',
        useCustomRoyalty: false,
        royaltyReceiver: '',
        royaltyPercentage: ''
      });
      setAttributes(metadata.attributes || []);
    }
  }, [metadata, isEditing]);

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.image.trim()) {
      newErrors.image = 'Image URL is required';
    } else if (!isValidURL(formData.image)) {
      newErrors.image = 'Please enter a valid URL';
    }
    
    if (formData.external_url && !isValidURL(formData.external_url)) {
      newErrors.external_url = 'Please enter a valid URL';
    }
    
    if (formData.useCustomRoyalty) {
      if (!isValidAddress(formData.royaltyReceiver)) {
        newErrors.royaltyReceiver = 'Please enter a valid Ethereum address';
      }
      if (!isValidPercentage(formData.royaltyPercentage)) {
        newErrors.royaltyPercentage = 'Please enter a percentage between 0 and 100';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: '' }));
    }
  };

  // Add attribute
  const addAttribute = () => {
    if (newAttribute.trait_type.trim() && newAttribute.value.toString().trim()) {
      setAttributes([...attributes, { ...newAttribute }]);
      setNewAttribute({ trait_type: '', value: '' });
    }
  };

  // Remove attribute
  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_: { trait_type: string; value: string | number }, i: number) => i !== index));
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrors({});
    setShowAdvanced(false);
  };

  const handleSaveEdit = async () => {
    if (!validateForm()) return;
    
    try {
      setTxPending(true);
      
      if (!simulateData?.request || !writeContract) {
        throw new Error('Unable to simulate transaction');
      }
      
      await writeContract(simulateData.request as Parameters<typeof writeContract>[0]);
      
      // If custom royalty is set, set it after updating metadata
      if (formData.useCustomRoyalty && simulateRoyaltyData?.request && setTokenRoyalty) {
        setTimeout(async () => {
          try {
            setRoyaltyPending(true);
            await setTokenRoyalty(simulateRoyaltyData.request as Parameters<typeof setTokenRoyalty>[0]);
            setRoyaltyPending(false);
          } catch (err) {
            console.error('Failed to set token royalty:', err);
            setRoyaltyPending(false);
          }
        }, 3000); // Wait 3 seconds for metadata update to complete
      }
      
      // Wait a moment then refetch and reset
      setTimeout(() => {
        refetchUri();
        setIsEditing(false);
        setErrors({});
        setShowAdvanced(false);
        setTxPending(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to update token:', err);
      setTxPending(false);
    }
  };

  if (isNaN(tokenIdNum)) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <span>Invalid token ID: {tokenId}</span>
        </div>
        <Link href="/nfts/emn" className="btn bg-blue-600 text-white hover:bg-blue-700 border-0 mt-4">
          Back to Collection
        </Link>
      </div>
    );
  }

  // Calculate current royalty info for display
  const currentRoyaltyReceiver = tokenRoyaltyInfo?.[0] || null;
  const currentRoyaltyAmount = tokenRoyaltyInfo?.[1] || null;
  const currentRoyaltyPercentage = currentRoyaltyAmount ? 
    ((Number(currentRoyaltyAmount) / 10000) * 100).toFixed(2) : null;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Navigation */}
      <div className="text-sm">
        <ul className="flex items-center space-x-2 text-gray-600">
          <li><Link href="/nfts/emn" className="text-blue-600 hover:text-blue-800">EMN Collection</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900">Token #{tokenId}</li>
        </ul>
      </div>

      {/* Token Details / Edit Form */}
      <div className="card bg-white shadow-xl border border-gray-300">
        <div className="card-body p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {metadata?.name || `Token #${tokenId}`}
              </h1>
              {metadata?.name && (
                <p className="text-lg text-gray-600 mt-1">Token #{tokenId}</p>
              )}
              {!isEditing && metadata?.description && (
                <p className="text-gray-700 mt-2 max-w-2xl">{metadata.description}</p>
              )}
            </div>
            
            {/* Editor Controls */}
            {isConnected && isEditor && (
              <div className="flex gap-2">
                {!isEditing ? (
                  <button 
                    onClick={handleStartEdit}
                    className="btn bg-blue-600 text-white hover:bg-blue-700 border-0 px-6 py-3"
                  >
                    Edit Token
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      disabled={txPending || isPending}
                      className="btn bg-gray-500 text-white hover:bg-gray-600 border-0 px-4 py-3"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={txPending || isPending || !formData.name || !formData.description || !formData.image}
                      className="btn bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 border-0 px-6 py-3"
                    >
                      {txPending || isPending ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            /* EDIT MODE - Rich Form */
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Token Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Token name"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                    {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      External URL
                    </label>
                    <input
                      type="url"
                      value={formData.external_url}
                      onChange={(e) => handleInputChange('external_url', e.target.value)}
                      placeholder="https://example.com"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                    {errors.external_url && <p className="text-red-600 text-sm mt-1">{errors.external_url}</p>}
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your NFT..."
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                  {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Image URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                  {errors.image && <p className="text-red-600 text-sm mt-1">{errors.image}</p>}
                  {formData.image && isValidURL(formData.image) && (
                    <div className="mt-3">
                      <img
                        src={formData.image}
                        alt="NFT Preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Attributes */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Attributes</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    value={newAttribute.trait_type}
                    onChange={(e) => setNewAttribute((prev: { trait_type: string; value: string }) => ({ ...prev, trait_type: e.target.value }))}
                    placeholder="Trait Type (e.g., Color)"
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                  <input
                    type="text"
                    value={newAttribute.value}
                    onChange={(e) => setNewAttribute((prev: { trait_type: string; value: string }) => ({ ...prev, value: e.target.value }))}
                    placeholder="Value (e.g., Blue)"
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="btn bg-green-600 text-white hover:bg-green-700 border-0 px-4 py-3"
                  >
                    Add Attribute
                  </button>
                </div>
                
                {attributes.length > 0 && (
                  <div className="space-y-2">
                    {attributes.map((attr: { trait_type: string; value: string | number }, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                        <span className="text-sm">
                          <strong>{attr.trait_type}:</strong> {attr.value}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttribute(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Advanced Options */}
              <div className="bg-gray-50 rounded-xl p-6">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center text-xl font-bold text-gray-900 mb-4"
                >
                  Advanced Options
                  <svg
                    className={`w-5 h-5 ml-2 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {showAdvanced && (
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.useCustomRoyalty}
                          onChange={(e) => setFormData((prev: typeof formData) => ({ ...prev, useCustomRoyalty: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-gray-900">Update royalty settings for this token</span>
                      </label>
                    </div>
                    
                    {formData.useCustomRoyalty && (
                      <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Royalty Receiver Address
                          </label>
                          <input
                            type="text"
                            value={formData.royaltyReceiver}
                            onChange={(e) => handleInputChange('royaltyReceiver', e.target.value)}
                            placeholder="0x..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-mono"
                          />
                          {errors.royaltyReceiver && <p className="text-red-600 text-sm mt-1">{errors.royaltyReceiver}</p>}
                        </div>
                        
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Royalty Percentage (%)
                          </label>
                          <input
                            type="number"
                            value={formData.royaltyPercentage}
                            onChange={(e) => handleInputChange('royaltyPercentage', e.target.value)}
                            placeholder="2.5"
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                          />
                          {errors.royaltyPercentage && <p className="text-red-600 text-sm mt-1">{errors.royaltyPercentage}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Metadata Preview */}
              {formData.name && (
                <div className="bg-blue-50 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Metadata Preview</h2>
                  <pre className="bg-white p-4 rounded-lg border text-sm overflow-x-auto">
                    {JSON.stringify(JSON.parse(generateMetadataURI().replace('data:application/json;utf8,', '')), null, 2)}
                  </pre>
                </div>
              )}
              
              {/* Status Messages */}
              {royaltyPending && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <p className="text-yellow-800">
                    <span className="loading loading-spinner loading-xs mr-2"></span>
                    Updating token royalty settings...
                  </p>
                </div>
              )}
              
              {(error || royaltyError) && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    Error: {error?.message || royaltyError?.message}
                  </p>
                </div>
              )}
            </form>
          ) : (
            /* VIEW MODE - Display current token */
            <div className="grid md:grid-cols-2 gap-6">
              {/* Image Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Token Image</h2>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                  <TokenImageWrapper 
                    imageUrl={metadata?.image} 
                    alt={metadata?.name || `Token ${tokenId}`}
                  />
                </div>
              </div>

              {/* Token Information Section */}
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
                            {metadata.attributes.map((attr: { trait_type: string; value: string | number }, index: number) => (
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

                {/* Current Royalty Information */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">Current Royalty Settings</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-green-700">Royalty Receiver:</span>
                      {royaltyLoading ? (
                        <div className="inline-block bg-gray-200 animate-pulse w-32 h-4 rounded ml-2"></div>
                      ) : currentRoyaltyReceiver && currentRoyaltyReceiver !== '0x0000000000000000000000000000000000000000' ? (
                        <span className="text-sm text-green-800 ml-2 font-mono">
                          {`${currentRoyaltyReceiver.substring(0, 8)}...${currentRoyaltyReceiver.substring(currentRoyaltyReceiver.length - 6)}`}
                        </span>
                      ) : (
                        <span className="text-sm text-yellow-700 ml-2">Uses default royalty settings</span>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-green-700">Royalty Percentage:</span>
                      {royaltyLoading ? (
                        <div className="inline-block bg-gray-200 animate-pulse w-16 h-4 rounded ml-2"></div>
                      ) : currentRoyaltyPercentage !== null ? (
                        <span className="text-sm text-green-800 ml-2 font-semibold">
                          {currentRoyaltyPercentage}%
                        </span>
                      ) : (
                        <span className="text-sm text-yellow-700 ml-2">Uses default royalty settings</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Token URI Section */}
                <h2 className="text-xl font-semibold text-gray-800">Token URI</h2>
                
                {uriLoading ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <pre className="text-xs break-all whitespace-pre-wrap font-mono text-gray-700">
                      {tokenURI || 'No URI set'}
                    </pre>
                  </div>
                )}

                {/* Token Information */}
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
                          `${tokenOwner.substring(0, 8)}...${tokenOwner.substring(tokenOwner.length - 6)}`
                        ) : (
                          'Loading...'
                        )}
                      </div>
                      {tokenOwner && (
                        <div className="text-xs text-gray-500 break-all mt-1">{tokenOwner}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href="/nfts/emn" className="btn bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 px-6 py-3">
          ← Back to Collection
        </Link>
        
        {tokenIdNum > 0 && (
          <Link href={`/nfts/emn/${tokenIdNum - 1}`} className="btn bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 px-6 py-3">
            ← Previous Token
          </Link>
        )}
        
        <Link href={`/nfts/emn/${tokenIdNum + 1}`} className="btn bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 px-6 py-3">
          Next Token →
        </Link>
      </div>
    </div>
  );
}
