"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { 
  useReadEmnOwner,
  useReadEmnName,
  useReadEmnSymbol,
  useReadEmnContractUri,
  useReadEmnRoyaltyInfo,
  useWriteEmnSetDefaultRoyalty,
  useSimulateEmnSetDefaultRoyalty,
  useWriteEmnDeleteDefaultRoyalty,
  useSimulateEmnDeleteDefaultRoyalty,
  useWriteEmnTransferOwnership,
  useSimulateEmnTransferOwnership,
  useWriteEmnSetContractUri,
  useReadEmnGetTokenCounter,
  emnAddress
} from "@/abis";

export default function ContractAdminPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  
  // Contract address override state
  const [customAddress, setCustomAddress] = useState<string>('');
  const [addressOverride, setAddressOverride] = useState<string>('');
  const [addressError, setAddressError] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [implementationAddress, setImplementationAddress] = useState<string>('');
  const [implementationLoading, setImplementationLoading] = useState(false);
  
  // Validation functions (defined early to be used by other functions)
  const isValidAddress = (addr: string) => {
    return addr.length === 42 && addr.startsWith('0x') && /^0x[a-fA-F0-9]{40}$/.test(addr);
  };
  
  const isValidPercentage = (percentage: string) => {
    const pct = parseFloat(percentage);
    return !isNaN(pct) && pct >= 0 && pct <= 100;
  };
  
  const isValidURI = (uri: string) => {
    try {
      new URL(uri);
      return true;
    } catch {
      return false;
    }
  };
  
  // Generate contract URI from form data
  const generateContractURI = () => {
    if (useRawJSON) {
      return rawJSONData;
    }
    
    const metadata: Record<string, string | string[]> = {
      name: contractURIFormData.name,
    };
    
    // Add optional fields only if they have values
    if (contractURIFormData.symbol) metadata.symbol = contractURIFormData.symbol;
    if (contractURIFormData.description) metadata.description = contractURIFormData.description;
    if (contractURIFormData.image) metadata.image = contractURIFormData.image;
    if (contractURIFormData.banner_image) metadata.banner_image = contractURIFormData.banner_image;
    if (contractURIFormData.featured_image) metadata.featured_image = contractURIFormData.featured_image;
    if (contractURIFormData.external_link) metadata.external_link = contractURIFormData.external_link;
    if (contractURIFormData.collaborators.length > 0) {
      metadata.collaborators = contractURIFormData.collaborators.filter(c => c.trim() !== '');
    }
    
    return `data:application/json;utf8,${JSON.stringify(metadata)}`;
  };
  
  // Get the effective contract address (custom or default)
  const getContractAddress = (): `0x${string}` | undefined => {
    if (addressOverride && isValidAddress(addressOverride)) {
      return addressOverride as `0x${string}`;
    }
    // Return default address based on chain ID
    if (chainId && emnAddress[chainId as keyof typeof emnAddress]) {
      return emnAddress[chainId as keyof typeof emnAddress];
    }
    return undefined;
  };
  
  const effectiveAddress = getContractAddress();
  
  // Read the implementation address from ERC1967 proxy storage slot
  useEffect(() => {
    const fetchImplementationAddress = async () => {
      if (!publicClient || !effectiveAddress) {
        setImplementationAddress('');
        return;
      }
      
      try {
        setImplementationLoading(true);
        // ERC1967 implementation slot: keccak256("eip1967.proxy.implementation") - 1
        const ERC1967_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
        
        const implementationAddressRaw = await publicClient.getStorageAt({
          address: effectiveAddress,
          slot: ERC1967_IMPLEMENTATION_SLOT as `0x${string}`,
        });
        
        if (implementationAddressRaw && implementationAddressRaw !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          // Parse the implementation address from storage (remove leading zeros)
          const cleanAddress = `0x${implementationAddressRaw.slice(-40)}`;
          setImplementationAddress(cleanAddress);
        } else {
          setImplementationAddress('');
        }
      } catch (error) {
        console.error('Failed to fetch implementation address:', error);
        setImplementationAddress('');
      } finally {
        setImplementationLoading(false);
      }
    };
    
    fetchImplementationAddress();
  }, [publicClient, effectiveAddress]);
  
  // Contract reads with optional address override
  const { data: contractOwner, refetch: refetchOwner } = useReadEmnOwner();
  const { data: contractName } = useReadEmnName();
  const { data: contractSymbol } = useReadEmnSymbol();
  const { data: contractURI, refetch: refetchContractURI } = useReadEmnContractUri();
  const { data: tokenCounter } = useReadEmnGetTokenCounter();
  
  // Get current default royalty info (using token ID 0 and 10000 as sample sale price)
  const { data: royaltyInfo, isLoading: royaltyLoading, refetch: refetchRoyalty } = useReadEmnRoyaltyInfo({
    args: [BigInt(0), BigInt(10000)],
  });
  
  // Check if current user is the contract owner
  const isOwner = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase();
  
  // Parse contract URI to extract metadata
  const parseContractMetadata = () => {
    if (!contractURI) return null;
    
    try {
      let jsonStr = contractURI;
      if (contractURI.startsWith('data:application/json;utf8,')) {
        jsonStr = contractURI.substring('data:application/json;utf8,'.length);
      }
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error('Failed to parse contract metadata:', err);
      return null;
    }
  };
  
  const contractMetadata = parseContractMetadata();
  
  // Form states
  const [activeSection, setActiveSection] = useState<'overview' | 'royalty' | 'ownership' | 'metadata'>('overview');
  
  // Royalty management state
  const [royaltyFormData, setRoyaltyFormData] = useState({
    receiver: '',
    percentage: ''
  });
  const [royaltyPending, setRoyaltyPending] = useState(false);
  const [royaltyErrors, setRoyaltyErrors] = useState<Record<string, string>>({});
  
  // Contract URI management state
  const [contractURIFormData, setContractURIFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    image: '',
    banner_image: '',
    featured_image: '',
    external_link: '',
    collaborators: [] as string[]
  });
  const [contractURIPending, setContractURIPending] = useState(false);
  const [contractURIErrors, setContractURIErrors] = useState<Record<string, string>>({});
  const [useRawJSON, setUseRawJSON] = useState(false);
  const [rawJSONData, setRawJSONData] = useState('');
  
  // Ownership transfer state
  const [ownershipFormData, setOwnershipFormData] = useState({
    newOwner: ''
  });
  const [ownershipPending, setOwnershipPending] = useState(false);
  const [ownershipErrors, setOwnershipErrors] = useState<Record<string, string>>({});
  const [showOwnershipConfirm, setShowOwnershipConfirm] = useState(false);
  
  // Contract address management functions
  const handleAddressChange = (newAddress: string) => {
    setCustomAddress(newAddress);
    setAddressError('');
    
    if (newAddress && !isValidAddress(newAddress)) {
      setAddressError('Please enter a valid Ethereum address');
    }
  };
  
  const handleApplyAddress = () => {
    if (!customAddress) {
      setAddressOverride('');
      setShowAddressForm(false);
      return;
    }
    
    if (!isValidAddress(customAddress)) {
      setAddressError('Please enter a valid Ethereum address');
      return;
    }
    
    setAddressOverride(customAddress);
    setShowAddressForm(false);
    setAddressError('');
  };
  
  const handleResetToDefault = () => {
    setCustomAddress('');
    setAddressOverride('');
    setShowAddressForm(false);
    setAddressError('');
  };
  
  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 11155111: return 'Sepolia Testnet';
      default: return `Chain ${chainId}`;
    }
  };
  
  const getEtherscanUrl = (address: string, chainId: number) => {
    const baseUrl = chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io';
    return `${baseUrl}/address/${address}`;
  };
  
  // Contract writes for royalty management (with address override)
  const royaltyFeeNumerator = royaltyFormData.percentage ? 
    Math.floor(parseFloat(royaltyFormData.percentage) * 100) : 0;
  
  const { data: simulateSetRoyaltyData } = useSimulateEmnSetDefaultRoyalty({
    args: [
      royaltyFormData.receiver as `0x${string}`,
      BigInt(royaltyFeeNumerator)
    ],
    query: {
      enabled: !!(royaltyFormData.receiver && 
                 royaltyFormData.percentage && 
                 isValidAddress(royaltyFormData.receiver) &&
                 isValidPercentage(royaltyFormData.percentage) &&
                 isOwner),
    },
  });
  
  const { data: simulateDeleteRoyaltyData } = useSimulateEmnDeleteDefaultRoyalty({
    query: {
      enabled: !!(isOwner),
    },
  });
  
  const { writeContract: setDefaultRoyalty, isPending: isSetRoyaltyPending, error: setRoyaltyError } = useWriteEmnSetDefaultRoyalty();
  const { writeContract: deleteDefaultRoyalty, isPending: isDeleteRoyaltyPending, error: deleteRoyaltyError } = useWriteEmnDeleteDefaultRoyalty();
  
  // Contract writes for contract URI management
  const { writeContract: setContractURI, error: setContractURIError } = useWriteEmnSetContractUri();
  
  // Contract writes for ownership transfer (with address override)
  const { data: simulateTransferData } = useSimulateEmnTransferOwnership({
    args: [ownershipFormData.newOwner as `0x${string}`],
    query: {
      enabled: !!(ownershipFormData.newOwner && 
                 isValidAddress(ownershipFormData.newOwner) &&
                 isOwner),
    },
  });
  
  const { writeContract: transferOwnership, isPending: isTransferPending, error: transferError } = useWriteEmnTransferOwnership();
  
  // Initialize royalty form with current settings
  useEffect(() => {
    if (royaltyInfo && royaltyInfo[0] && royaltyInfo[0] !== '0x0000000000000000000000000000000000000000') {
      const currentPercentage = ((Number(royaltyInfo[1]) / 10000) * 100).toFixed(2);
      setRoyaltyFormData({
        receiver: royaltyInfo[0],
        percentage: currentPercentage
      });
    }
  }, [royaltyInfo]);
  
  // Initialize contract URI form with current settings
  useEffect(() => {
    if (contractURI) {
      try {
        // Try to parse the contract URI to populate form fields
        let jsonData;
        if (contractURI.startsWith('data:application/json;utf8,')) {
          jsonData = JSON.parse(contractURI.substring('data:application/json;utf8,'.length));
        } else if (contractURI.startsWith('data:application/json;base64,')) {
          jsonData = JSON.parse(atob(contractURI.substring('data:application/json;base64,'.length)));
        } else {
          // For external URIs, set raw JSON mode
          setUseRawJSON(true);
          setRawJSONData(contractURI);
          return;
        }
        
        // Populate form fields from parsed JSON
        setContractURIFormData({
          name: jsonData.name || '',
          symbol: jsonData.symbol || '',
          description: jsonData.description || '',
          image: jsonData.image || '',
          banner_image: jsonData.banner_image || '',
          featured_image: jsonData.featured_image || '',
          external_link: jsonData.external_link || '',
          collaborators: jsonData.collaborators || []
        });
      } catch (error) {
        console.error('Failed to parse contract URI:', error);
        setUseRawJSON(true);
        setRawJSONData(contractURI);
      }
    }
  }, [contractURI]);
  
  // Calculate current royalty info for display
  const currentRoyaltyReceiver = royaltyInfo?.[0] || null;
  const currentRoyaltyAmount = royaltyInfo?.[1] || null;
  const currentRoyaltyPercentage = currentRoyaltyAmount ? 
    ((Number(currentRoyaltyAmount) / 10000) * 100).toFixed(2) : null;
  const hasDefaultRoyalty = currentRoyaltyReceiver && currentRoyaltyReceiver !== '0x0000000000000000000000000000000000000000';
  
  // Form validation functions
  const validateRoyaltyForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!royaltyFormData.receiver.trim()) {
      newErrors.receiver = 'Receiver address is required';
    } else if (!isValidAddress(royaltyFormData.receiver)) {
      newErrors.receiver = 'Please enter a valid Ethereum address';
    }
    
    if (!royaltyFormData.percentage.trim()) {
      newErrors.percentage = 'Percentage is required';
    } else if (!isValidPercentage(royaltyFormData.percentage)) {
      newErrors.percentage = 'Please enter a percentage between 0 and 100';
    }
    
    setRoyaltyErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateContractURIForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (useRawJSON) {
      if (!rawJSONData.trim()) {
        newErrors.rawJSON = 'Contract URI is required';
      } else if (rawJSONData.trim().length < 10) {
        newErrors.rawJSON = 'Contract URI must be at least 10 characters long';
      }
    } else {
      if (!contractURIFormData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      
      // Validate URI formats
      const uriFields = ['image', 'banner_image', 'featured_image', 'external_link'];
      uriFields.forEach(field => {
        const value = contractURIFormData[field as keyof typeof contractURIFormData] as string;
        if (value && !isValidURI(value)) {
          newErrors[field] = 'Please enter a valid URI';
        }
      });
      
      // Validate collaborators (should be valid Ethereum addresses)
      contractURIFormData.collaborators.forEach((collaborator, index) => {
        if (collaborator && !isValidAddress(collaborator)) {
          newErrors[`collaborator_${index}`] = 'Please enter a valid Ethereum address';
        }
      });
    }
    
    setContractURIErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateOwnershipForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!ownershipFormData.newOwner.trim()) {
      newErrors.newOwner = 'New owner address is required';
    } else if (!isValidAddress(ownershipFormData.newOwner)) {
      newErrors.newOwner = 'Please enter a valid Ethereum address';
    } else if (ownershipFormData.newOwner.toLowerCase() === address?.toLowerCase()) {
      newErrors.newOwner = 'New owner cannot be the same as current owner';
    }
    
    setOwnershipErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form input changes
  const handleRoyaltyInputChange = (field: string, value: string) => {
    setRoyaltyFormData(prev => ({ ...prev, [field]: value }));
    if (royaltyErrors[field]) {
      setRoyaltyErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const handleContractURIInputChange = (field: string, value: string) => {
    if (field === 'rawJSON') {
      setRawJSONData(value);
    } else {
      setContractURIFormData(prev => ({ ...prev, [field]: value }));
    }
    if (contractURIErrors[field]) {
      setContractURIErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const handleOwnershipInputChange = (field: string, value: string) => {
    setOwnershipFormData(prev => ({ ...prev, [field]: value }));
    if (ownershipErrors[field]) {
      setOwnershipErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const handleAddCollaborator = () => {
    setContractURIFormData(prev => ({
      ...prev,
      collaborators: [...prev.collaborators, '']
    }));
  };
  
  const handleRemoveCollaborator = (index: number) => {
    setContractURIFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter((_, i) => i !== index)
    }));
  };
  
  const handleCollaboratorChange = (index: number, value: string) => {
    setContractURIFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.map((collab, i) => i === index ? value : collab)
    }));
    
    // Clear error for this collaborator
    const errorKey = `collaborator_${index}`;
    if (contractURIErrors[errorKey]) {
      setContractURIErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };
  
  // Handle royalty updates
  const handleSetRoyalty = async () => {
    if (!validateRoyaltyForm()) return;
    
    try {
      setRoyaltyPending(true);
      
      if (!simulateSetRoyaltyData?.request || !setDefaultRoyalty) {
        throw new Error('Unable to simulate transaction');
      }
      
      await setDefaultRoyalty(simulateSetRoyaltyData.request as Parameters<typeof setDefaultRoyalty>[0]);
      
      setTimeout(() => {
        refetchRoyalty();
        setRoyaltyPending(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to set default royalty:', err);
      setRoyaltyPending(false);
    }
  };
  
  const handleDeleteRoyalty = async () => {
    try {
      setRoyaltyPending(true);
      
      if (!simulateDeleteRoyaltyData?.request || !deleteDefaultRoyalty) {
        throw new Error('Unable to simulate transaction');
      }
      
      await deleteDefaultRoyalty(simulateDeleteRoyaltyData.request as Parameters<typeof deleteDefaultRoyalty>[0]);
      
      setTimeout(() => {
        refetchRoyalty();
        setRoyaltyFormData({ receiver: '', percentage: '' });
        setRoyaltyPending(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to delete default royalty:', err);
      setRoyaltyPending(false);
    }
  };
  
  // Handle contract URI updates
  const handleSetContractURI = async () => {
    if (!validateContractURIForm()) return;
    
    try {
      setContractURIPending(true);
      
      const newURI = generateContractURI();
      
      // We need to manually call the contract function since we're generating the URI dynamically
      if (!setContractURI) {
        throw new Error('Contract function not available');
      }
      
      await setContractURI({
        args: [newURI],
      });
      
      setTimeout(() => {
        refetchContractURI();
        setContractURIPending(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to set contract URI:', err);
      setContractURIPending(false);
    }
  };
  
  // Handle ownership transfer
  const handleTransferOwnership = async () => {
    if (!validateOwnershipForm()) return;
    
    try {
      setOwnershipPending(true);
      
      if (!simulateTransferData?.request || !transferOwnership) {
        throw new Error('Unable to simulate transaction');
      }
      
      await transferOwnership(simulateTransferData.request as Parameters<typeof transferOwnership>[0]);
      
      setTimeout(() => {
        refetchOwner();
        setOwnershipFormData({ newOwner: '' });
        setShowOwnershipConfirm(false);
        setOwnershipPending(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to transfer ownership:', err);
      setOwnershipPending(false);
    }
  };
  
  if (!isConnected) {
    return (
      <div className="container mx-auto p-6">
        <div className="card bg-white shadow-xl border border-gray-300">
          <div className="card-body p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Contract Administration</h1>
            <p className="text-gray-600 mb-6">Please connect your wallet to access contract administration.</p>
            <appkit-button />
          </div>
        </div>
      </div>
    );
  }
  
  if (!isOwner) {
    return (
      <div className="container mx-auto p-6">
        <div className="card bg-white shadow-xl border border-gray-300">
          <div className="card-body p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Contract Administration</h1>
            <div className="bg-red-50 border border-red-300 rounded-xl p-6">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <h2 className="text-xl font-bold text-red-900 mb-2">Access Denied</h2>
              <p className="text-red-800">Only the contract owner can access administration functions.</p>
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
      {/* Navigation */}
      <div className="text-sm">
        <ul className="flex items-center space-x-2 text-gray-600">
          <li><Link href="/nfts/emn" className="text-blue-600 hover:text-blue-800">EMN Collection</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900">Contract Administration</li>
        </ul>
      </div>
      
      {/* Contract Address Inspector */}
      <div className="card bg-white shadow-lg border border-gray-300">
        <div className="card-body p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Contract Address Inspector</h2>
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="btn bg-gray-600 text-white hover:bg-gray-700 border-0 px-4 py-2 text-sm"
            >
              {showAddressForm ? 'Cancel' : 'Override Address'}
            </button>
          </div>
          
          {/* Current Address Info */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Network</label>
              <div className="text-sm font-semibold text-gray-900 mt-1">
                {chainId ? getNetworkName(chainId) : 'Unknown'}
              </div>
              <div className="text-xs text-gray-600">Chain ID: {chainId || 'N/A'}</div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Default Address</label>
              <div className="text-xs font-mono text-gray-900 mt-1 break-all">
                {chainId && emnAddress[chainId as keyof typeof emnAddress] 
                  ? emnAddress[chainId as keyof typeof emnAddress]
                  : 'No default for this network'
                }
              </div>
              {chainId && emnAddress[chainId as keyof typeof emnAddress] && (
                <a
                  href={getEtherscanUrl(emnAddress[chainId as keyof typeof emnAddress], chainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                >
                  View on Explorer →
                </a>
              )}
            </div>
          </div>
          
          {/* Proxy and Implementation Addresses */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Proxy Address {addressOverride && '(Custom)'}
                </label>
              </div>
              <div className="text-xs font-mono text-blue-900 mt-1 break-all">
                {effectiveAddress || 'No address available'}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                This is the address users interact with
              </div>
              {addressOverride && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Custom</span>
                  <button
                    onClick={handleResetToDefault}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Reset
                  </button>
                </div>
              )}
              {effectiveAddress && (
                <a
                  href={getEtherscanUrl(effectiveAddress, chainId || 1)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                >
                  View on Explorer →
                </a>
              )}
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
                <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">Implementation Address</label>
              </div>
              {implementationLoading ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-green-600">Loading...</span>
                </div>
              ) : implementationAddress ? (
                <div className="text-xs font-mono text-green-900 mt-1 break-all">
                  {implementationAddress}
                </div>
              ) : (
                <div className="text-xs text-green-600 mt-1">
                  No implementation found
                </div>
              )}
              <div className="text-xs text-green-600 mt-1">
                This contains the actual contract logic
              </div>
              {implementationAddress && (
                <a
                  href={getEtherscanUrl(implementationAddress, chainId || 1)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:text-green-800 mt-1 inline-block"
                >
                  View on Explorer →
                </a>
              )}
            </div>
          </div>
          
          {/* Proxy Pattern Info */}
          {implementationAddress && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-1">ERC1967 Upgradeable Proxy</h4>
                  <p className="text-xs text-gray-600">
                    This contract uses the ERC1967 proxy pattern. The proxy address stores data and forwards calls to the implementation address which contains the contract logic. This allows for upgrades without changing the main contract address.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Address Override Form */}
          {showAddressForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">Override Contract Address</h3>
              <p className="text-xs text-blue-700 mb-4">
                Enter a custom contract address to inspect a different EMN contract instance. 
                This will override the default address for this network.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-blue-800 mb-1 block">
                    Contract Address
                  </label>
                  <input
                    type="text"
                    value={customAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder="0x..."
                    className="w-full text-xs font-mono p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                  {addressError && (
                    <p className="text-red-600 text-xs mt-1">{addressError}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyAddress}
                    disabled={Boolean(customAddress && !isValidAddress(customAddress))}
                    className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 border-0 px-4 py-2 text-xs"
                  >
                    Apply Address
                  </button>
                  <button
                    onClick={handleResetToDefault}
                    className="btn bg-gray-500 text-white hover:bg-gray-600 border-0 px-4 py-2 text-xs"
                  >
                    Use Default
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Status Messages */}
          {!effectiveAddress && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
              <p className="text-yellow-800 text-xs">
                No contract address available. Either switch to a supported network or enter a custom address.
              </p>
            </div>
          )}
          
          {effectiveAddress && !contractName && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
              <p className="text-yellow-800 text-xs">
                Contract not responding. This address may not be a valid EMN contract or the network connection may be unstable.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Header */}
      <div className="card bg-white shadow-xl border border-gray-300">
        <div className="card-body p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Contract Administration
            {addressOverride && <span className="text-lg text-blue-600 ml-2">(Custom Contract)</span>}
          </h1>
          <p className="text-gray-600">
            {addressOverride 
              ? `Inspecting custom contract: ${addressOverride}`
              : 'Manage contract-level settings and configurations'
            }
          </p>
          
          {/* Custom Contract Warning */}
          {addressOverride && !isOwner && (
            <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 mt-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-orange-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-orange-800">Inspection Mode</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    You are viewing a custom contract and are not the owner. Write operations will be disabled.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {addressOverride && isOwner && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-4 mt-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-green-800">Owner Access</h4>
                  <p className="text-sm text-green-700 mt-1">
                    You are the owner of this custom contract and can perform administrative operations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Section Navigation */}
      <div className="card bg-white shadow-lg border border-gray-300">
        <div className="card-body p-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSection('overview')}
              className={`btn border-0 px-6 py-3 ${
                activeSection === 'overview' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection('royalty')}
              className={`btn border-0 px-6 py-3 ${
                activeSection === 'royalty' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Royalty Settings
            </button>
            <button
              onClick={() => setActiveSection('metadata')}
              className={`btn border-0 px-6 py-3 ${
                activeSection === 'metadata' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Contract Metadata
            </button>
            <button
              onClick={() => setActiveSection('ownership')}
              className={`btn border-0 px-6 py-3 ${
                activeSection === 'ownership' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ownership Transfer
            </button>
          </div>
        </div>
      </div>
      
      {/* Content Sections */}
      {activeSection === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Contract Information */}
          <div className="card bg-white shadow-xl border border-gray-300">
            <div className="card-body p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contract Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Contract Name</label>
                  <div className="text-lg font-semibold text-gray-900">{contractName || 'Loading...'}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Symbol</label>
                  <div className="text-lg font-semibold text-gray-900">{contractSymbol || 'Loading...'}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Supply</label>
                  <div className="text-lg font-semibold text-gray-900">
                    {tokenCounter !== undefined ? Number(tokenCounter) : 'Loading...'} tokens
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Contract Owner</label>
                  <div className="text-sm font-mono text-gray-900 break-all">
                    {contractOwner || 'Loading...'}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Proxy Address</label>
                  <div className="text-sm font-mono text-gray-900 break-all">
                    {effectiveAddress || 'Not available'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">User-facing contract address</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Implementation Address</label>
                  {implementationLoading ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-500">Loading...</span>
                    </div>
                  ) : implementationAddress ? (
                    <>
                      <div className="text-sm font-mono text-gray-900 break-all">
                        {implementationAddress}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Contains the contract logic</div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">Not detected</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Contract Metadata */}
          <div className="card bg-white shadow-xl border border-gray-300">
            <div className="card-body p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contract Metadata</h2>
              
              {contractMetadata ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <div className="text-lg font-semibold text-gray-900">{contractMetadata.name}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <div className="text-gray-900">{contractMetadata.description}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Contract URI</label>
                    <div className="bg-gray-50 p-3 rounded-lg border text-xs font-mono break-all">
                      {contractURI}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No metadata available</div>
              )}
            </div>
          </div>
          
          {/* Current Royalty Settings */}
          <div className="card bg-white shadow-xl border border-gray-300 md:col-span-2">
            <div className="card-body p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Current Default Royalty Settings</h2>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-green-700">Default Royalty Receiver:</span>
                    {royaltyLoading ? (
                      <div className="inline-block bg-gray-200 animate-pulse w-32 h-4 rounded ml-2"></div>
                    ) : hasDefaultRoyalty ? (
                      <span className="text-sm text-green-800 ml-2 font-mono">
                        {`${currentRoyaltyReceiver!.substring(0, 8)}...${currentRoyaltyReceiver!.substring(currentRoyaltyReceiver!.length - 6)}`}
                      </span>
                    ) : (
                      <span className="text-sm text-yellow-700 ml-2">No default royalty set</span>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-700">Default Royalty Percentage:</span>
                    {royaltyLoading ? (
                      <div className="inline-block bg-gray-200 animate-pulse w-16 h-4 rounded ml-2"></div>
                    ) : hasDefaultRoyalty ? (
                      <span className="text-sm text-green-800 ml-2 font-semibold">
                        {currentRoyaltyPercentage}%
                      </span>
                    ) : (
                      <span className="text-sm text-yellow-700 ml-2">No default royalty set</span>
                    )}
                  </div>
                  {hasDefaultRoyalty && (
                    <div className="text-xs text-green-600 mt-2">
                      Full address: {currentRoyaltyReceiver}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeSection === 'royalty' && (
        <div className="card bg-white shadow-xl border border-gray-300">
          <div className="card-body p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Default Royalty Management</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Set/Update Royalty */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Set Default Royalty</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Royalty Receiver Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={royaltyFormData.receiver}
                        onChange={(e) => handleRoyaltyInputChange('receiver', e.target.value)}
                        placeholder="0x..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-mono"
                      />
                      {royaltyErrors.receiver && <p className="text-red-600 text-sm mt-1">{royaltyErrors.receiver}</p>}
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Royalty Percentage (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={royaltyFormData.percentage}
                        onChange={(e) => handleRoyaltyInputChange('percentage', e.target.value)}
                        placeholder="2.5"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                      {royaltyErrors.percentage && <p className="text-red-600 text-sm mt-1">{royaltyErrors.percentage}</p>}
                    </div>
                    
                    <button
                      onClick={handleSetRoyalty}
                      disabled={royaltyPending || isSetRoyaltyPending || !royaltyFormData.receiver || !royaltyFormData.percentage}
                      className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 border-0 w-full py-3"
                    >
                      {royaltyPending || isSetRoyaltyPending ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          {hasDefaultRoyalty ? 'Updating...' : 'Setting...'}
                        </>
                      ) : (
                        hasDefaultRoyalty ? 'Update Default Royalty' : 'Set Default Royalty'
                      )}
                    </button>
                    
                    {setRoyaltyError && (
                      <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                        <p className="text-red-800 text-sm">
                          Error: {setRoyaltyError.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Delete Royalty */}
              {hasDefaultRoyalty && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Remove Default Royalty</h3>
                    
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <div>
                          <h4 className="text-sm font-semibold text-yellow-800">Warning</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Removing the default royalty will disable royalties for all tokens that don&apos;t have individual royalty settings.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleDeleteRoyalty}
                      disabled={royaltyPending || isDeleteRoyaltyPending}
                      className="btn bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 border-0 w-full py-3"
                    >
                      {royaltyPending || isDeleteRoyaltyPending ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          Removing...
                        </>
                      ) : (
                        'Remove Default Royalty'
                      )}
                    </button>
                    
                    {deleteRoyaltyError && (
                      <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                        <p className="text-red-800 text-sm">
                          Error: {deleteRoyaltyError.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {activeSection === 'metadata' && (
        <div className="card bg-white shadow-xl border border-gray-300">
          <div className="card-body p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contract Metadata Management</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Update Contract URI */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Contract URI</h3>
                  
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-800">Contract URI Information</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          The contract URI provides collection-level metadata for this NFT contract, including name, description, and other collection details.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Form Mode Toggle */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="uriMode"
                          checked={!useRawJSON}
                          onChange={() => setUseRawJSON(false)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Structured Form</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="uriMode"
                          checked={useRawJSON}
                          onChange={() => setUseRawJSON(true)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Raw JSON/URI</span>
                      </label>
                    </div>
                  </div>
                  
                  {useRawJSON ? (
                    /* Raw JSON Mode */
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Contract URI <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={4}
                          value={rawJSONData}
                          onChange={(e) => handleContractURIInputChange('rawJSON', e.target.value)}
                          placeholder="https://api.example.com/contract-metadata.json or data:application/json;utf8,{...}"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-mono text-sm"
                        />
                        {contractURIErrors.rawJSON && <p className="text-red-600 text-sm mt-1">{contractURIErrors.rawJSON}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          Enter a URI pointing to JSON metadata or inline JSON data URI
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Structured Form Mode */
                    <div className="space-y-4">
                      {/* Name - Required */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={contractURIFormData.name}
                          onChange={(e) => handleContractURIInputChange('name', e.target.value)}
                          placeholder="My NFT Collection"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                        {contractURIErrors.name && <p className="text-red-600 text-sm mt-1">{contractURIErrors.name}</p>}
                      </div>
                      
                      {/* Symbol */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Symbol
                        </label>
                        <input
                          type="text"
                          value={contractURIFormData.symbol}
                          onChange={(e) => handleContractURIInputChange('symbol', e.target.value)}
                          placeholder="MNC"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                        {contractURIErrors.symbol && <p className="text-red-600 text-sm mt-1">{contractURIErrors.symbol}</p>}
                      </div>
                      
                      {/* Description */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={contractURIFormData.description}
                          onChange={(e) => handleContractURIInputChange('description', e.target.value)}
                          placeholder="A unique collection of digital artworks..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                        {contractURIErrors.description && <p className="text-red-600 text-sm mt-1">{contractURIErrors.description}</p>}
                      </div>
                      
                      {/* Image */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Profile Image
                        </label>
                        <input
                          type="url"
                          value={contractURIFormData.image}
                          onChange={(e) => handleContractURIInputChange('image', e.target.value)}
                          placeholder="https://example.com/profile-image.jpg"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                        {contractURIErrors.image && <p className="text-red-600 text-sm mt-1">{contractURIErrors.image}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          Profile picture for the collection
                        </p>
                      </div>
                      
                      {/* Banner Image */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Banner Image
                        </label>
                        <input
                          type="url"
                          value={contractURIFormData.banner_image}
                          onChange={(e) => handleContractURIInputChange('banner_image', e.target.value)}
                          placeholder="https://example.com/banner.jpg"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                        {contractURIErrors.banner_image && <p className="text-red-600 text-sm mt-1">{contractURIErrors.banner_image}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          Banner image for the collection
                        </p>
                      </div>
                      
                      {/* Featured Image */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Featured Image
                        </label>
                        <input
                          type="url"
                          value={contractURIFormData.featured_image}
                          onChange={(e) => handleContractURIInputChange('featured_image', e.target.value)}
                          placeholder="https://example.com/featured.jpg"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                        {contractURIErrors.featured_image && <p className="text-red-600 text-sm mt-1">{contractURIErrors.featured_image}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          Featured image for highlights
                        </p>
                      </div>
                      
                      {/* External Link */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          External Link
                        </label>
                        <input
                          type="url"
                          value={contractURIFormData.external_link}
                          onChange={(e) => handleContractURIInputChange('external_link', e.target.value)}
                          placeholder="https://example.com"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                        {contractURIErrors.external_link && <p className="text-red-600 text-sm mt-1">{contractURIErrors.external_link}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          External website for the collection
                        </p>
                      </div>
                      
                      {/* Collaborators */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Collaborators
                        </label>
                        <div className="space-y-2">
                          {contractURIFormData.collaborators.map((collaborator, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={collaborator}
                                onChange={(e) => handleCollaboratorChange(index, e.target.value)}
                                placeholder="0x..."
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-mono text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveCollaborator(index)}
                                className="btn bg-red-500 text-white hover:bg-red-600 border-0 px-3 py-2 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {contractURIFormData.collaborators.some((_, index) => contractURIErrors[`collaborator_${index}`]) && (
                            <p className="text-red-600 text-sm">
                              Please check collaborator addresses for errors
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleAddCollaborator}
                          className="btn bg-green-500 text-white hover:bg-green-600 border-0 px-4 py-2 text-sm mt-2"
                        >
                          Add Collaborator
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                          Ethereum addresses of authorized editors
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleSetContractURI}
                      disabled={contractURIPending || !isOwner}
                      className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 border-0 w-full py-3"
                    >
                      {contractURIPending ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          Updating...
                        </>
                      ) : (
                        'Update Contract URI'
                      )}
                    </button>
                    
                    {setContractURIError && (
                      <div className="bg-red-50 border border-red-300 rounded-lg p-4 mt-4">
                        <p className="text-red-800 text-sm">
                          Error: {setContractURIError.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Current Contract URI Display */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Contract URI</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Raw Contract URI
                      </label>
                      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                        <div className="text-xs font-mono text-gray-800 break-all">
                          {contractURI || 'No contract URI set'}
                        </div>
                      </div>
                      {contractURI && contractURI.startsWith('http') && (
                        <div className="mt-2">
                          <a 
                            href={contractURI} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn bg-blue-600 text-white hover:bg-blue-700 border-0 px-4 py-2 text-sm"
                          >
                            View External URI →
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Parsed Metadata */}
                    {contractMetadata && (
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Parsed Metadata
                        </label>
                        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-3">
                          <div>
                            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Name:</span>
                            <div className="text-sm font-semibold text-gray-900 mt-1">{contractMetadata.name}</div>
                          </div>
                          
                          <div>
                            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Description:</span>
                            <div className="text-sm text-gray-900 mt-1">{contractMetadata.description}</div>
                          </div>
                          
                          {contractMetadata.image && (
                            <div>
                              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Image:</span>
                              <div className="text-sm text-gray-900 mt-1 break-all">{contractMetadata.image}</div>
                            </div>
                          )}
                          
                          {contractMetadata.external_link && (
                            <div>
                              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">External Link:</span>
                              <div className="text-sm text-gray-900 mt-1 break-all">{contractMetadata.external_link}</div>
                            </div>
                          )}

                          {contractMetadata.seller_fee_basis_points && (
                            <div>
                              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Seller Fee Basis Points:</span>
                              <div className="text-sm text-gray-900 mt-1">{contractMetadata.seller_fee_basis_points}</div>
                            </div>
                          )}

                          {contractMetadata.fee_recipient && (
                            <div>
                              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Fee Recipient:</span>
                              <div className="text-sm text-gray-900 mt-1 font-mono break-all">{contractMetadata.fee_recipient}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* JSON View */}
                    {contractMetadata && (
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          JSON Structure
                        </label>
                        <div className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs font-mono overflow-auto max-h-64">
                          <pre>{JSON.stringify(contractMetadata, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Metadata Format Examples */}
            <div className="border-t border-gray-200 pt-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Metadata Format Examples</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">External JSON URI</h4>
                  <div className="bg-gray-900 text-green-400 rounded p-3 text-xs font-mono overflow-auto">
                    <pre>{`https://api.example.com/contract-metadata.json`}</pre>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Points to external JSON file hosted on your server or IPFS
                  </p>
                </div>
                
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Inline JSON Data URI</h4>
                  <div className="bg-gray-900 text-green-400 rounded p-3 text-xs font-mono overflow-auto">
                    <pre>{`data:application/json;utf8,{
  "name": "My NFT Collection",
  "description": "A unique collection...",
  "image": "https://...",
  "external_link": "https://..."
}`}</pre>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Inline JSON data stored directly in the contract
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeSection === 'ownership' && (
        <div className="card bg-white shadow-xl border border-gray-300">
          <div className="card-body p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ownership Transfer</h2>
            
            <div className="max-w-md mx-auto">
              {!showOwnershipConfirm ? (
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                      <div>
                        <h4 className="text-sm font-semibold text-red-800">Critical Operation</h4>
                        <p className="text-sm text-red-700 mt-1">
                          Transferring ownership will give the new owner complete control over this contract. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Current Owner
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono break-all">
                      {contractOwner}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      New Owner Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ownershipFormData.newOwner}
                      onChange={(e) => handleOwnershipInputChange('newOwner', e.target.value)}
                      placeholder="0x..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white font-mono"
                    />
                    {ownershipErrors.newOwner && <p className="text-red-600 text-sm mt-1">{ownershipErrors.newOwner}</p>}
                  </div>
                  
                  <button
                    onClick={() => {
                      if (validateOwnershipForm()) {
                        setShowOwnershipConfirm(true);
                      }
                    }}
                    disabled={!ownershipFormData.newOwner}
                    className="btn bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 border-0 w-full py-3"
                  >
                    Proceed to Confirmation
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-red-900 mb-4">Confirm Ownership Transfer</h3>
                    
                    <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
                      <p className="text-red-800 text-sm mb-4">
                        You are about to transfer ownership from:
                      </p>
                      <div className="space-y-2">
                        <div>
                          <strong>Current Owner:</strong>
                          <div className="font-mono text-xs break-all mt-1">{contractOwner}</div>
                        </div>
                        <div>
                          <strong>New Owner:</strong>
                          <div className="font-mono text-xs break-all mt-1">{ownershipFormData.newOwner}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowOwnershipConfirm(false)}
                        disabled={ownershipPending || isTransferPending}
                        className="btn bg-gray-500 text-white hover:bg-gray-600 border-0 flex-1 py-3"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleTransferOwnership}
                        disabled={ownershipPending || isTransferPending}
                        className="btn bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 border-0 flex-1 py-3"
                      >
                        {ownershipPending || isTransferPending ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Transferring...
                          </>
                        ) : (
                          'Confirm Transfer'
                        )}
                      </button>
                    </div>
                    
                    {transferError && (
                      <div className="bg-red-50 border border-red-300 rounded-lg p-4 mt-4">
                        <p className="text-red-800 text-sm">
                          Error: {transferError.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex gap-2">
        <Link href="/nfts/emn" className="btn bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 px-6 py-3">
          ← Back to Collection
        </Link>
      </div>
    </div>
  );
} 