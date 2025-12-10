import React, { useState, useEffect } from 'react';
import { Coins, Plus, TrendingUp, Clock, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TokenService } from '../../services/tokenService';
import { UserProfileRow } from '../../lib/supabase';
import DatabaseSetupGuide from '../setup/DatabaseSetupGuide';

interface TokenBalanceProps {
  onRechargeClick?: () => void;
  showRechargeButton?: boolean;
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
}

const TokenBalance: React.FC<TokenBalanceProps> = ({
  onRechargeClick,
  showRechargeButton = true,
  size = 'medium',
  showStats = false,
}) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userProfile = await TokenService.getUserProfile(user.id);
      
      if (!userProfile) {
        // User profile doesn't exist - likely database not set up or new user
        console.log('User profile not found, might need database setup');
        setError('Database setup required');
        return;
      }
      
      setProfile(userProfile);
    } catch (err) {
      console.error('Error loading user profile:', err);
      // Check if it's a database connection error
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('relation') || errorMessage.includes('table')) {
        setError('Database not configured');
      } else {
        setError('Failed to load tokens');
      }
    } finally {
      setLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'p-3',
          text: 'text-sm',
          icon: 'w-4 h-4',
          button: 'px-2 py-1 text-xs',
        };
      case 'large':
        return {
          container: 'p-6',
          text: 'text-lg',
          icon: 'w-6 h-6',
          button: 'px-4 py-2 text-sm',
        };
      default:
        return {
          container: 'p-4',
          text: 'text-base',
          icon: 'w-5 h-5',
          button: 'px-3 py-2 text-sm',
        };
    }
  };

  const getTokenColor = (tokens: number) => {
    if (tokens <= 0) return 'text-red-600';
    if (tokens <= 5) return 'text-orange-600';
    if (tokens <= 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  const sizeClasses = getSizeClasses();

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${sizeClasses.container} animate-pulse`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`bg-gray-200 rounded-full ${sizeClasses.icon}`}></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          {showRechargeButton && (
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          )}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    const isDatabaseError = error?.includes('Database') || error?.includes('setup');
    
    return (
      <div className={`${isDatabaseError ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} border rounded-lg ${sizeClasses.container}`}>
        <div className="flex items-center space-x-2">
          <Coins className={`${sizeClasses.icon} ${isDatabaseError ? 'text-yellow-600' : 'text-red-500'}`} />
          <div className="flex flex-col">
            <span className={`${isDatabaseError ? 'text-yellow-700' : 'text-red-600'} ${sizeClasses.text} font-medium`}>
              {isDatabaseError ? 'Setup Required' : error || 'Failed to load'}
            </span>
            {isDatabaseError && (
              <span className="text-xs text-yellow-600 mt-1">
                Run database schema first
              </span>
            )}
          </div>
          {isDatabaseError && (
            <button
              onClick={() => setShowSetupGuide(true)}
              className="ml-2 p-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded text-xs transition-colors"
              title="Setup Database"
            >
              <Settings className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        onClick={onRechargeClick}
        className={`
          bg-white hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 
          rounded-lg border border-gray-200 ${sizeClasses.container} shadow-sm
          transition-all duration-300 hover:shadow-lg hover:border-indigo-400
          cursor-pointer group w-full transform hover:scale-[1.02]
          ${profile.tokens <= 5 ? 'ring-2 ring-orange-300 border-orange-300' : ''}
        `}
        title={`${profile.tokens} tokens available • Click to add more`}
      >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`
            p-2 rounded-lg transition-all duration-300
            ${profile.tokens <= 5 
              ? 'bg-gradient-to-r from-orange-100 to-red-100 group-hover:from-orange-200 group-hover:to-red-200' 
              : 'bg-gradient-to-r from-indigo-100 to-purple-100 group-hover:from-indigo-200 group-hover:to-purple-200'
            }
          `}>
            <Coins className={`
              ${sizeClasses.icon} transition-all duration-300 transform group-hover:scale-110
              ${profile.tokens <= 5 ? 'text-orange-600' : 'text-indigo-600 group-hover:text-indigo-700'}
            `} />
          </div>
          <div className="flex flex-col flex-1">
            <div className="flex items-baseline space-x-1">
              <span className={`font-bold ${getTokenColor(profile.tokens)} ${sizeClasses.text}`}>
                {profile.tokens}
              </span>
              <span className={`text-xs text-gray-500 ${sizeClasses.text === 'text-sm' ? 'text-xs' : 'text-sm'}`}>
                tokens
              </span>
            </div>
            {showStats && (
              <span className="text-xs text-gray-500">
                {profile.total_tokens_used} used total
              </span>
            )}
          </div>
        </div>

        {/* Subtle hover indicator - only shows on hover or when tokens are very low */}
        <div className={`
          flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300
          ${profile.tokens <= 2 
            ? 'bg-red-100 text-red-600 opacity-100 animate-pulse' 
            : profile.tokens <= 5
            ? 'bg-orange-100 text-orange-600 opacity-70 group-hover:opacity-100'
            : 'bg-indigo-100 text-indigo-600 opacity-0 group-hover:opacity-100 group-hover:bg-indigo-200'
          }
        `}>
          <Plus className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>
    </button>

      {/* Warning for low tokens - positioned below the main component */}
      <div>
        {profile.tokens <= 5 && (
          <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-3 h-3 text-orange-600" />
                </div>
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium text-orange-800">
                  {profile.tokens === 0 
                    ? 'No tokens remaining'
                    : `${profile.tokens} token${profile.tokens === 1 ? '' : 's'} remaining`
                  }
                </span>
                <div className="text-xs text-orange-600 mt-0.5">
                  Click the token count above to add more
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats section for large size */}
      {showStats && size === 'large' && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {profile.total_tokens_used}
              </div>
              <div className="text-xs text-gray-500">Total Used</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {profile.tokens}
              </div>
              <div className="text-xs text-gray-500">Remaining</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Database Setup Guide */}
      <DatabaseSetupGuide 
        isOpen={showSetupGuide}
        onClose={() => setShowSetupGuide(false)}
      />
    </div>
  );
};

export default TokenBalance;