"use client";
import Link from 'next/link';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { 
  useReadEmnBalanceOf, 
  useReadEmnGetTokenCounter,
  useReadEmnHasRole,
  useReadEmnAdminRole,
  useReadEmnEditorRole,
  useReadEmnTokenUri,
  useReadEmnOwnerOf,
  useReadEmnContractUri,
  useReadEmnRoyaltyInfo,
  useWriteEmnGrantRole,
  useWriteEmnRevokeRole,
  useSimulateEmnGrantRole,
  useSimulateEmnRevokeRole,
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
        <div className="card bg-white shadow-lg border border-gray-300 hover:shadow-xl transition-all duration-200 cursor-pointer">
          <div className="card-body p-6 animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/nfts/emn/${tokenId}`}>
      <div className="card bg-white shadow-lg border border-gray-300 hover:shadow-xl hover:border-blue-300 transition-all duration-200 cursor-pointer">
        <div className="card-body p-6">
          <h3 className="card-title text-xl font-bold text-gray-900 mb-4">Token #{tokenId}</h3>
          
          <div className="space-y-4">
            <div>
              <span className="font-semibold text-sm text-gray-700 uppercase tracking-wide">URI:</span>
              <div className="bg-gray-100 p-4 rounded-lg text-sm break-all font-mono text-gray-800 mt-2 border">
                {tokenURI ? (
                  tokenURI.length > 60 ? `${tokenURI.substring(0, 60)}...` : tokenURI
                ) : (
                  'No URI set'
                )}
              </div>
            </div>
            
            {owner && (
              <div>
                <span className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Owner:</span>
                <div className="bg-gray-100 p-4 rounded-lg text-sm break-all font-mono text-gray-800 mt-2 border">
                  {`${owner.substring(0, 8)}...${owner.substring(owner.length - 6)}`}
                </div>
              </div>
            )}
          </div>
          
          <div className="card-actions justify-end mt-6">
            <span className="text-sm font-medium text-blue-600 hover:text-blue-800">Click to view details →</span>
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
  const { data: contractURI } = useReadEmnContractUri();
  
  // Get role constants
  const { data: adminRole } = useReadEmnAdminRole();
  const { data: editorRole } = useReadEmnEditorRole();
  
  // Check user roles
  const { data: isAdmin, refetch: refetchAdminRole } = useReadEmnHasRole({
    args: adminRole && address ? [adminRole, address] : undefined,
    query: { enabled: !!(adminRole && address) }
  });
  
  const { data: isEditor, refetch: refetchEditorRole } = useReadEmnHasRole({
    args: editorRole && address ? [editorRole, address] : undefined,
    query: { enabled: !!(editorRole && address) }
  });
  
  // Get current royalty info (using token ID 0 and 10000 as sample sale price to get percentage)
  const { data: royaltyInfo, isLoading: royaltyLoading } = useReadEmnRoyaltyInfo({
    args: [BigInt(0), BigInt(10000)], // tokenId: 0, salePrice: 10000 (to calculate percentage)
  });
  
  // State for role management
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [newEditorAddress, setNewEditorAddress] = useState('');
  const [roleAction, setRoleAction] = useState<'grant' | 'revoke'>('grant');
  const [rolePending, setRolePending] = useState(false);
  
  // State for default royalty management
  const [showDefaultRoyaltyForm, setShowDefaultRoyaltyForm] = useState(false);
  const [defaultRoyaltyReceiver, setDefaultRoyaltyReceiver] = useState('');
  const [defaultRoyaltyPercentage, setDefaultRoyaltyPercentage] = useState('');
  const [defaultRoyaltyPending, setDefaultRoyaltyPending] = useState(false);
  
  // Role management hooks
  const { data: simulateGrantRoleData } = useSimulateEmnGrantRole({
    args: editorRole && newEditorAddress ? [editorRole, newEditorAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!(showRoleForm && 
                 roleAction === 'grant' &&
                 editorRole && 
                 newEditorAddress.length === 42 && 
                 newEditorAddress.startsWith('0x') && 
                 isAdmin),
    },
  });
  
  const { data: simulateRevokeRoleData } = useSimulateEmnRevokeRole({
    args: editorRole && newEditorAddress ? [editorRole, newEditorAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!(showRoleForm && 
                 roleAction === 'revoke' &&
                 editorRole && 
                 newEditorAddress.length === 42 && 
                 newEditorAddress.startsWith('0x') && 
                 isAdmin),
    },
  });
  
  const { writeContract: grantRole, isPending: isGrantPending, error: grantError } = useWriteEmnGrantRole();
  const { writeContract: revokeRole, isPending: isRevokePending, error: revokeError } = useWriteEmnRevokeRole();
  
  // Default royalty hooks
  const defaultRoyaltyFeeNumerator = defaultRoyaltyPercentage ? Math.floor(parseFloat(defaultRoyaltyPercentage) * 100) : 0; // Convert percentage to basis points
  const { data: simulateDefaultRoyaltyData } = useSimulateEmnSetDefaultRoyalty({
    args: [
      defaultRoyaltyReceiver as `0x${string}`,
      BigInt(defaultRoyaltyFeeNumerator)
    ],
    query: {
      enabled: !!(showDefaultRoyaltyForm && 
                 defaultRoyaltyReceiver.length === 42 && 
                 defaultRoyaltyReceiver.startsWith('0x') &&
                 defaultRoyaltyPercentage && 
                 !isNaN(parseFloat(defaultRoyaltyPercentage)) &&
                 parseFloat(defaultRoyaltyPercentage) >= 0 &&
                 parseFloat(defaultRoyaltyPercentage) <= 100 &&
                 isEditor),
    },
  });
  
  const { writeContract: setDefaultRoyalty, isPending: isDefaultRoyaltyPending, error: defaultRoyaltyError } = useWriteEmnSetDefaultRoyalty();
  
  // Generate array of token IDs from 0 to tokenCounter-1
  const tokenIds = tokenCounter ? Array.from({ length: Number(tokenCounter) }, (_, i) => i) : [];

  // Calculate royalty percentage from royalty info
  const currentRoyaltyReceiver = royaltyInfo?.[0] || null;
  const currentRoyaltyAmount = royaltyInfo?.[1] || null;
  const currentRoyaltyPercentage = currentRoyaltyAmount ? 
    ((Number(currentRoyaltyAmount) / 10000) * 100).toFixed(2) : null;

  const handleStartRoleManagement = (action: 'grant' | 'revoke') => {
    setShowRoleForm(true);
    setRoleAction(action);
    setNewEditorAddress('');
  };

  const handleCancelRole = () => {
    setShowRoleForm(false);
    setNewEditorAddress('');
  };

  const handleRoleManagement = async () => {
    const simulateData = roleAction === 'grant' ? simulateGrantRoleData : simulateRevokeRoleData;
    const roleFunction = roleAction === 'grant' ? grantRole : revokeRole;
    
    if (!simulateData?.request || !roleFunction) return;
    
    try {
      setRolePending(true);
      await roleFunction(simulateData.request);
      
      // Wait a moment then refetch role data
      setTimeout(() => {
        refetchAdminRole();
        refetchEditorRole();
        setShowRoleForm(false);
        setNewEditorAddress('');
        setRolePending(false);
      }, 2000);
    } catch (err) {
      console.error(`Failed to ${roleAction} role:`, err);
      setRolePending(false);
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
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl">
        <div className="card-body p-8">
          <h1 className="text-4xl font-bold mb-6">EMN NFT Collection</h1>
          <div className="bg-white/95 backdrop-blur rounded-xl p-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Total Tokens</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {counterLoading ? '...' : tokenCounter?.toString() || '0'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Your Balance</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{balanceOf?.toString() || '0'}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Your Roles</div>
                <div className="text-lg font-bold text-gray-900 mt-2">
                  {isAdmin && isEditor ? 'Admin + Editor' : 
                   isAdmin ? 'Admin' : 
                   isEditor ? 'Editor' : 
                   'No Roles'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Current Royalty Information */}
          <div className="bg-white/95 backdrop-blur rounded-xl p-6 mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Current Royalty Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide mb-2">Royalty Receiver</div>
                {royaltyLoading ? (
                  <div className="bg-gray-100 p-3 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-300 rounded"></div>
                  </div>
                ) : currentRoyaltyReceiver && currentRoyaltyReceiver !== '0x0000000000000000000000000000000000000000' ? (
                  <div className="bg-gray-100 border border-gray-300 p-3 rounded-lg">
                    <div className="text-sm font-mono text-gray-800 break-all">
                      {currentRoyaltyReceiver}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {`${currentRoyaltyReceiver.substring(0, 8)}...${currentRoyaltyReceiver.substring(currentRoyaltyReceiver.length - 6)}`}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-300 p-3 rounded-lg text-yellow-800 text-sm">
                    No royalty receiver set
                  </div>
                )}
              </div>
              
              <div>
                <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide mb-2">Royalty Percentage</div>
                {royaltyLoading ? (
                  <div className="bg-gray-100 p-3 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-16"></div>
                  </div>
                ) : currentRoyaltyPercentage !== null ? (
                  <div className="bg-gray-100 border border-gray-300 p-3 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {currentRoyaltyPercentage}%
                    </div>
                    <div className="text-xs text-gray-600">
                      {currentRoyaltyAmount?.toString()} basis points
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-300 p-3 rounded-lg text-yellow-800 text-sm">
                    No royalty percentage set
                  </div>
                )}
              </div>
            </div>
            
            {currentRoyaltyReceiver && currentRoyaltyReceiver !== '0x0000000000000000000000000000000000000000' && (
              <div className="mt-4 bg-green-50 border border-green-300 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-green-800 text-sm font-medium">
                    Royalties are active: {currentRoyaltyPercentage}% of each sale goes to the royalty receiver
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Contract URI Section */}
          {contractURI && (
            <div className="bg-white/95 backdrop-blur rounded-xl p-6 mt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contract URI</h3>
              <div className="bg-gray-100 border border-gray-300 p-4 rounded-lg text-sm font-mono text-gray-800 break-all">
                {contractURI}
              </div>
              {contractURI.startsWith('http') && (
                <div className="mt-4">
                  <a 
                    href={contractURI} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn bg-blue-600 text-white hover:bg-blue-700 border-0 px-6 py-3"
                  >
                    View Contract Metadata →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Role-Based Controls */}
      {isConnected && (isAdmin || isEditor) && (
        <div className="card bg-gradient-to-r from-green-600 to-green-700 text-white shadow-xl">
          <div className="card-body p-8">
            <h2 className="text-2xl font-bold mb-2">Role-Based Controls</h2>
            <p className="text-green-100 text-lg mb-6">
              {isAdmin && isEditor ? 'You have both Admin and Editor roles.' :
               isAdmin ? 'You have Admin role - you can manage roles and access all admin functions.' :
               'You have Editor role - you can mint tokens and manage metadata.'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Minting Section - Available to Editors */}
              {isEditor && (
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Minting</h3>
                  <div className="space-y-3">
                    <p className="text-green-100 text-sm">Create new NFTs in the collection.</p>
                    <Link href="/nfts/emn/mint" className="btn bg-white text-green-700 hover:bg-gray-100 border-0 px-6 py-3 font-semibold w-full">
                      Mint New Token
                    </Link>
                  </div>
                </div>
              )}

              {/* Admin Functions - Available to Admins and Editors */}
              {(isAdmin || isEditor) && (
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    {isAdmin ? 'Admin Functions' : 'Contract Management'}
                  </h3>
                  <div className="space-y-3">
                    <p className="text-green-100 text-sm">
                      {isAdmin 
                        ? 'Manage contract settings, roles, and advanced features.' 
                        : 'Manage contract metadata and royalty settings.'}
                    </p>
                    <Link href="/nfts/emn/admin" className="btn bg-orange-600 text-white hover:bg-orange-700 border-0 px-6 py-3 font-semibold w-full">
                      {isAdmin ? 'Contract Admin' : 'Contract Settings'}
                    </Link>
                  </div>
                </div>
              )}

              {/* Role Management - Available to Admins */}
              {isAdmin && (
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Role Management</h3>
                  {!showRoleForm ? (
                    <div className="space-y-3">
                      <p className="text-green-100 text-sm">Grant or revoke editor roles.</p>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleStartRoleManagement('grant')}
                          className="btn bg-blue-600 text-white hover:bg-blue-700 border-0 px-4 py-2 text-sm w-full"
                        >
                          Grant Editor Role
                        </button>
                        <button
                          onClick={() => handleStartRoleManagement('revoke')}
                          className="btn bg-red-600 text-white hover:bg-red-700 border-0 px-4 py-2 text-sm w-full"
                        >
                          Revoke Editor Role
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-white text-sm font-semibold mb-2 block">
                          {roleAction === 'grant' ? 'Grant Editor Role To' : 'Revoke Editor Role From'}
                        </label>
                        <input
                          type="text"
                          value={newEditorAddress}
                          onChange={(e) => setNewEditorAddress(e.target.value)}
                          placeholder="0x..."
                          className="w-full text-sm font-mono p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                        {newEditorAddress && !isValidAddress(newEditorAddress) && (
                          <p className="text-red-200 text-sm mt-2 bg-red-500/20 px-3 py-2 rounded">Please enter a valid Ethereum address</p>
                        )}
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={handleRoleManagement}
                          disabled={
                            rolePending || 
                            isGrantPending ||
                            isRevokePending ||
                            !isValidAddress(newEditorAddress)
                          }
                          className={`btn ${roleAction === 'grant' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white disabled:bg-gray-400 disabled:text-gray-200 border-0 px-4 py-2 text-sm`}
                        >
                          {rolePending || isGrantPending || isRevokePending ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              {roleAction === 'grant' ? 'Granting...' : 'Revoking...'}
                            </>
                          ) : (
                            `${roleAction === 'grant' ? 'Grant' : 'Revoke'} Role`
                          )}
                        </button>
                        <button
                          onClick={handleCancelRole}
                          disabled={rolePending || isGrantPending || isRevokePending}
                          className="btn bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-300 border-0 px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                      
                      {(grantError || revokeError) && (
                        <div className="bg-red-100 border border-red-400 text-red-800 rounded-lg p-3">
                          <span className="text-sm">Error: {grantError?.message || revokeError?.message}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Default Royalty - Available to Editors */}
              {isEditor && (
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Quick Royalty</h3>
                  {!showDefaultRoyaltyForm ? (
                    <div className="space-y-3">
                      <p className="text-green-100 text-sm">Set default royalty for all tokens.</p>
                      <button
                        onClick={handleStartDefaultRoyalty}
                        className="btn bg-purple-600 text-white hover:bg-purple-700 border-0 px-6 py-3 font-semibold"
                      >
                        Set Default Royalty
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-white text-sm font-semibold mb-2 block">Royalty Receiver Address</label>
                        <input
                          type="text"
                          value={defaultRoyaltyReceiver}
                          onChange={(e) => setDefaultRoyaltyReceiver(e.target.value)}
                          placeholder="0x..."
                          className="w-full text-sm font-mono p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                        />
                        {defaultRoyaltyReceiver && !isValidAddress(defaultRoyaltyReceiver) && (
                          <p className="text-red-200 text-sm mt-2 bg-red-500/20 px-3 py-2 rounded">Please enter a valid Ethereum address</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="text-white text-sm font-semibold mb-2 block">Default Royalty Percentage (%)</label>
                        <input
                          type="number"
                          value={defaultRoyaltyPercentage}
                          onChange={(e) => setDefaultRoyaltyPercentage(e.target.value)}
                          placeholder="2.5"
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full text-sm p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                        />
                        {defaultRoyaltyPercentage && !isValidPercentage(defaultRoyaltyPercentage) && (
                          <p className="text-red-200 text-sm mt-2 bg-red-500/20 px-3 py-2 rounded">Please enter a percentage between 0 and 100</p>
                        )}
                        <p className="text-green-100 text-sm mt-2">Applies to all tokens without specific royalty set</p>
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={handleSetDefaultRoyalty}
                          disabled={
                            defaultRoyaltyPending || 
                            isDefaultRoyaltyPending || 
                            !isValidAddress(defaultRoyaltyReceiver) ||
                            !isValidPercentage(defaultRoyaltyPercentage)
                          }
                          className="btn bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:text-gray-200 border-0 px-4 py-2"
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
                          className="btn bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-300 border-0 px-4 py-2"
                        >
                          Cancel
                        </button>
                      </div>
                      
                      {defaultRoyaltyError && (
                        <div className="bg-red-100 border border-red-400 text-red-800 rounded-lg p-3">
                          <span className="text-sm">Error: {defaultRoyaltyError.message}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Token Collection */}
      <div className="card bg-white shadow-xl border border-gray-300">
        <div className="card-body p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Token Collection</h2>
          
          {counterLoading && (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
              <span className="ml-3 text-gray-700 text-lg">Loading tokens...</span>
            </div>
          )}
          
          {tokenCounter && Number(tokenCounter) === 0 && (
            <div className="bg-blue-50 border border-blue-300 rounded-xl p-6 flex items-center gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-blue-500 shrink-0 w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div className="flex-1">
                <span className="text-blue-900 text-lg font-semibold">No tokens have been minted yet.</span>
                {isAdmin && (
                  <div className="mt-3">
                    <Link href="/nfts/emn/mint" className="btn bg-blue-600 text-white hover:bg-blue-700 border-0 px-6 py-3 font-semibold">
                      Mint First Token
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {tokenIds.length > 0 && (
            <>
              <div className="mb-6">
                <p className="text-gray-600 text-lg">
                  Showing {tokenIds.length} token{tokenIds.length !== 1 ? 's' : ''} in the collection. Click on any token to view details.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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