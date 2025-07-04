"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { 
  useReadEmnHasRole,
  useReadEmnEditorRole,
  useReadEmnGetTokenCounter,
  useWriteEmnMintNft,
  useWriteEmnMintNftTo,
  useSimulateEmnMintNft,
  useSimulateEmnMintNftTo,
  useWriteEmnSetTokenRoyalty,
  useSimulateEmnSetTokenRoyalty
} from "@/abis";

// Trait/Attribute interface
interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

// NFT Metadata interface
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: NFTAttribute[];
}

export default function MintPage() {
  const { address, isConnected } = useAccount();
  
  // Get editor role and check if user has it
  const { data: editorRole } = useReadEmnEditorRole();
  const { data: isEditor } = useReadEmnHasRole({
    args: editorRole && address ? [editorRole, address] : undefined,
    query: { enabled: !!(editorRole && address) }
  });
  
  const { data: tokenCounter, refetch: refetchTokenCounter } = useReadEmnGetTokenCounter();
  
  // Validation functions (moved to top)
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
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    external_url: '',
    mintTo: 'self', // 'self' or 'custom'
    customRecipient: '',
    useCustomRoyalty: false,
    royaltyReceiver: '',
    royaltyPercentage: ''
  });
  
  // Attributes state
  const [attributes, setAttributes] = useState<NFTAttribute[]>([]);
  const [newAttribute, setNewAttribute] = useState({ trait_type: '', value: '' });
  
  // UI state
  const [mintPending, setMintPending] = useState(false);
  const [royaltyPending, setRoyaltyPending] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Generate metadata URI
  const generateMetadataURI = (): string => {
    const metadata: NFTMetadata = {
      name: formData.name,
      description: formData.description,
      image: formData.image,
    };
    
    if (formData.external_url) {
      metadata.external_url = formData.external_url;
    }
    
    if (attributes.length > 0) {
      metadata.attributes = attributes;
    }
    
    return `data:application/json;utf8,${JSON.stringify(metadata)}`;
  };
  
  // Determine mint recipient
  const getMintRecipient = (): `0x${string}` => {
    return formData.mintTo === 'custom' ? 
      formData.customRecipient as `0x${string}` : 
      address as `0x${string}`;
  };
  
  // Mint function selection and simulation
  const tokenURI = formData.name ? generateMetadataURI() : '';
  const mintRecipient = getMintRecipient();
  const useCustomRecipient = formData.mintTo === 'custom' && isValidAddress(formData.customRecipient);
  
  // Simulate minting based on recipient
  const { data: simulateMintData } = useSimulateEmnMintNft({
    args: [tokenURI],
    query: {
      enabled: !!(tokenURI && formData.mintTo === 'self' && isConnected && isEditor),
    },
  });
  
  const { data: simulateMintToData } = useSimulateEmnMintNftTo({
    args: [mintRecipient, tokenURI],
    query: {
      enabled: !!(tokenURI && useCustomRecipient && isConnected && isEditor),
    },
  });
  
  // Mint contract writes
  const { writeContract: mintNft, isPending: isMintPending, error: mintError } = useWriteEmnMintNft();
  const { writeContract: mintNftTo, isPending: isMintToPending, error: mintToError } = useWriteEmnMintNftTo();
  
  // Custom royalty simulation and write
  const royaltyFeeNumerator = formData.royaltyPercentage ? 
    Math.floor(parseFloat(formData.royaltyPercentage) * 100) : 0;
  const nextTokenId = tokenCounter ? Number(tokenCounter) : 0;
  
  const { data: simulateRoyaltyData } = useSimulateEmnSetTokenRoyalty({
    args: [
      BigInt(nextTokenId),
      formData.royaltyReceiver as `0x${string}`,
      BigInt(royaltyFeeNumerator)
    ],
    query: {
      enabled: !!(formData.useCustomRoyalty && 
                 isValidAddress(formData.royaltyReceiver) &&
                 isValidPercentage(formData.royaltyPercentage) &&
                 isConnected &&
                 isEditor),
    },
  });
  
  const { writeContract: setTokenRoyalty, error: royaltyError } = useWriteEmnSetTokenRoyalty();
  
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
    
    if (formData.mintTo === 'custom' && !isValidAddress(formData.customRecipient)) {
      newErrors.customRecipient = 'Please enter a valid Ethereum address';
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
  
  // Add attribute
  const addAttribute = () => {
    if (newAttribute.trait_type.trim() && newAttribute.value.toString().trim()) {
      setAttributes([...attributes, { ...newAttribute }]);
      setNewAttribute({ trait_type: '', value: '' });
    }
  };
  
  // Remove attribute
  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };
  
  // Handle mint
  const handleMint = async () => {
    if (!validateForm()) return;
    
    try {
      setMintPending(true);
      
      const simulateData = formData.mintTo === 'custom' ? simulateMintToData : simulateMintData;
      const mintFunction = formData.mintTo === 'custom' ? mintNftTo : mintNft;
      
      if (!simulateData?.request || !mintFunction) {
        throw new Error('Unable to simulate transaction');
      }
      
      await mintFunction(simulateData.request as Parameters<typeof mintFunction>[0]);
      
      // If custom royalty is set, set it after minting
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
        }, 3000); // Wait 3 seconds for mint to complete
      }
      
      // Reset form and refetch data
      setTimeout(() => {
        refetchTokenCounter();
        setFormData({
          name: '',
          description: '',
          image: '',
          external_url: '',
          mintTo: 'self',
          customRecipient: '',
          useCustomRoyalty: false,
          royaltyReceiver: '',
          royaltyPercentage: ''
        });
        setAttributes([]);
        setMintPending(false);
      }, 2000);
      
    } catch (err) {
      console.error('Failed to mint NFT:', err);
      setMintPending(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // if (!isConnected) {
  //   return (
  //     <div className="container mx-auto p-6">
  //       <div className="card bg-white shadow-xl border border-gray-300">
  //         <div className="card-body p-8 text-center">
  //           <h1 className="text-3xl font-bold text-gray-900 mb-4">Mint New NFT</h1>
  //           <p className="text-gray-600 mb-6">Please connect your wallet to mint NFTs.</p>
  //           <appkit-button />
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
  
  if (!isEditor) {
    return (
      <div className="container mx-auto p-6">
        <div className="card bg-white shadow-xl border border-gray-300">
          <div className="card-body p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Mint New NFT</h1>
            <div className="bg-red-50 border border-red-300 rounded-xl p-6">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <h2 className="text-xl font-bold text-red-900 mb-2">Access Denied</h2>
              <p className="text-red-800">Only users with Editor role can mint new NFTs.</p>
            </div>
            <div className="mt-6">
              <Link href="/nfts/emn" className="btn bg-blue-600 text-white hover:bg-blue-700 border-0 px-6 py-3">
                ← Back to Collection
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-sm">
        <ul className="flex items-center space-x-2 text-gray-600">
          <li><Link href="/nfts/emn" className="text-blue-600 hover:text-blue-800">EMN Collection</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900">Mint NFT</li>
        </ul>
      </div>
      
      <div className="card bg-white shadow-xl border border-gray-300">
        <div className="card-body p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Mint New NFT</h1>
          
          <form onSubmit={(e) => { e.preventDefault(); handleMint(); }} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="My Awesome NFT"
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
                  onChange={(e) => setNewAttribute(prev => ({ ...prev, trait_type: e.target.value }))}
                  placeholder="Trait Type (e.g., Color)"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
                <input
                  type="text"
                  value={newAttribute.value}
                  onChange={(e) => setNewAttribute(prev => ({ ...prev, value: e.target.value }))}
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
                  {attributes.map((attr, index) => (
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
            
            {/* Recipient */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Mint Recipient</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="self"
                      checked={formData.mintTo === 'self'}
                      onChange={(e) => handleInputChange('mintTo', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-gray-900">Mint to myself ({address})</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="custom"
                      checked={formData.mintTo === 'custom'}
                      onChange={(e) => handleInputChange('mintTo', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-gray-900">Mint to custom address</span>
                  </label>
                </div>
                
                {formData.mintTo === 'custom' && (
                  <div className="ml-6">
                    <input
                      type="text"
                      value={formData.customRecipient}
                      onChange={(e) => handleInputChange('customRecipient', e.target.value)}
                      placeholder="0x..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-mono"
                    />
                    {errors.customRecipient && <p className="text-red-600 text-sm mt-1">{errors.customRecipient}</p>}
                  </div>
                )}
              </div>
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
                        onChange={(e) => setFormData(prev => ({ ...prev, useCustomRoyalty: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Set custom royalty for this token</span>
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
            
            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Link href="/nfts/emn" className="btn bg-gray-500 text-white hover:bg-gray-600 border-0 px-6 py-3">
                ← Cancel
              </Link>
              
              <button
                type="submit"
                disabled={mintPending || isMintPending || isMintToPending || !formData.name || !formData.description || !formData.image}
                className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-200 border-0 px-6 py-3"
              >
                {mintPending || isMintPending || isMintToPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Minting...
                  </>
                ) : (
                  'Mint NFT'
                )}
              </button>
            </div>
            
            {/* Status Messages */}
            {royaltyPending && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <p className="text-yellow-800">
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                  Setting custom royalty for minted token...
                </p>
              </div>
            )}
            
            {(mintError || mintToError || royaltyError) && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  Error: {mintError?.message || mintToError?.message || royaltyError?.message}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}