import React, { useState } from 'react';
import TokenBalanceEnhanced from './TokenBalanceEnhanced';
import TokenRechargeModal from './TokenRechargeModal';

// Mock profile data for testing
const mockProfiles = [
  { tokens: 0, total_tokens_used: 45 },
  { tokens: 1, total_tokens_used: 23 },
  { tokens: 3, total_tokens_used: 17 },
  { tokens: 8, total_tokens_used: 12 },
  { tokens: 25, total_tokens_used: 75 },
  { tokens: 100, total_tokens_used: 200 }
];

const TokenBalanceDemo: React.FC = () => {
  const [selectedProfile, setSelectedProfile] = useState(0);
  const [showRecharge, setShowRecharge] = useState(false);

  // Mock the token service to return different token amounts
  React.useEffect(() => {
    const originalTokenService = require('../../services/tokenService').TokenService;
    const mockTokenService = {
      ...originalTokenService,
      getUserProfile: async () => mockProfiles[selectedProfile]
    };
    
    // This is just for demo purposes - in real implementation, the service would fetch from database
    return () => {
      // Cleanup if needed
    };
  }, [selectedProfile]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Enhanced Token Balance Demo</h1>
        
        {/* Profile Selector */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Test Different Token Amounts</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {mockProfiles.map((profile, index) => (
              <button
                key={index}
                onClick={() => setSelectedProfile(index)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200
                  ${selectedProfile === index 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }
                `}
              >
                <div className="font-semibold">{profile.tokens} tokens</div>
                <div className="text-xs opacity-75">{profile.total_tokens_used} used</div>
              </button>
            ))}
          </div>
        </div>

        {/* Component Showcase */}
        <div className="space-y-8">
          {/* Small Size */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Small Size (Navbar)</h3>
            <div className="max-w-xs">
              <TokenBalanceEnhanced 
                size="small"
                onRechargeClick={() => setShowRecharge(true)}
              />
            </div>
          </div>

          {/* Medium Size */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Medium Size (Default)</h3>
            <div className="max-w-sm">
              <TokenBalanceEnhanced 
                size="medium"
                onRechargeClick={() => setShowRecharge(true)}
              />
            </div>
          </div>

          {/* Large Size with Stats */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Large Size with Stats</h3>
            <div className="max-w-md">
              <TokenBalanceEnhanced 
                size="large"
                showStats={true}
                onRechargeClick={() => setShowRecharge(true)}
              />
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-white rounded-lg p-6 mt-8 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">✨ Enhanced Features</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>No explicit "Recharge" text - clean token-only display</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Subtle "+" icon appears on hover or when tokens are low</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Color-coded by token level (red=critical, orange=low, blue=good, green=excellent)</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Smooth hover animations and visual feedback</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Pulse animation for critical low tokens (≤2)</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Improved warning messages with better UX copy</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Recharge Modal */}
      <TokenRechargeModal 
        isOpen={showRecharge}
        onClose={() => setShowRecharge(false)}
        onSuccess={(tokens) => {
          console.log(`Demo: Successfully recharged ${tokens} tokens`);
        }}
      />
    </div>
  );
};

export default TokenBalanceDemo;