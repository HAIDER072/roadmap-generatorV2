import React from 'react';
import { AlertCircle, Coins, CreditCard, X } from 'lucide-react';

interface InsufficientTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecharge: () => void;
  tokensRemaining: number;
  tokensRequired: number;
}

const InsufficientTokensModal: React.FC<InsufficientTokensModalProps> = ({
  isOpen,
  onClose,
  onRecharge,
  tokensRemaining,
  tokensRequired,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Insufficient Tokens</h2>
              <p className="text-sm text-gray-500">You need more tokens to continue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-6 mb-4">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{tokensRemaining}</div>
                  <div className="text-sm text-gray-600">Current</div>
                </div>
                <div className="text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{tokensRequired}</div>
                  <div className="text-sm text-gray-600">Required</div>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm">
                You need <strong>{tokensRequired - tokensRemaining} more tokens</strong> to generate this roadmap.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Coins className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">What are tokens?</span>
                </div>
                <p className="text-blue-800 text-sm text-left">
                  Tokens are used to power our AI roadmap generation. Each roadmap creation costs 1 token, 
                  ensuring fair usage and maintaining high-quality service for all users.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Quick Recharge</span>
                </div>
                <p className="text-green-800 text-sm text-left">
                  Recharge your account instantly with secure payments. Choose from affordable token packages 
                  starting from just ₹199 for 100 tokens.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200"
            >
              Maybe Later
            </button>
            <button
              onClick={onRecharge}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Coins className="w-5 h-5" />
              <span>Recharge Now</span>
            </button>
          </div>

          {/* Additional info */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-xs text-gray-600">
                <div className="font-semibold text-gray-900">100+ Tokens</div>
                <div>Starter Pack</div>
              </div>
              <div className="text-xs text-gray-600">
                <div className="font-semibold text-gray-900">Instant</div>
                <div>Activation</div>
              </div>
              <div className="text-xs text-gray-600">
                <div className="font-semibold text-gray-900">Secure</div>
                <div>Payment</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsufficientTokensModal;