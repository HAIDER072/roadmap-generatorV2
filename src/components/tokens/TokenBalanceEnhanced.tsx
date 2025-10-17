import React, { useState, useEffect } from 'react';
import { Coins, Plus, Clock, Settings, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TokenService } from '../../services/tokenService';
import { UserProfileRow } from '../../lib/supabase';
import DatabaseSetupGuide from '../setup/DatabaseSetupGuide';

interface TokenBalanceEnhancedProps {
  onRechargeClick?: () => void;
  showRechargeButton?: boolean;
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
}

const TokenBalanceEnhanced: React.FC<TokenBalanceEnhancedProps> = ({
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
  const [isHovered, setIsHovered] = useState(false);

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
        console.log('User profile not found, might need database setup');
        setError('Database setup required');
        return;
      }
      
      setProfile(userProfile);
    } catch (err) {
      console.error('Error loading user profile:', err);
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
          container: 'px-4 py-2',
          text: 'text-sm',
          tokenText: 'text-lg',
          icon: 'w-4 h-4',
          iconContainer: 'w-8 h-8',
        };
      case 'large':
        return {
          container: 'px-6 py-4',
          text: 'text-lg',
          tokenText: 'text-2xl',
          icon: 'w-6 h-6',
          iconContainer: 'w-12 h-12',
        };
      default:
        return {
          container: 'px-5 py-3',
          text: 'text-base',
          tokenText: 'text-xl',
          icon: 'w-5 h-5',
          iconContainer: 'w-10 h-10',
        };
    }
  };

  const getTokenStatus = (tokens: number) => {
    if (tokens <= 0) return { 
      color: 'text-red-600', 
      bgColor: 'from-red-50 to-red-100', 
      ringColor: 'ring-red-200',
      iconBg: 'from-red-100 to-red-200',
      iconColor: 'text-red-600'
    };
    if (tokens <= 2) return { 
      color: 'text-red-600', 
      bgColor: 'from-red-50 to-orange-50', 
      ringColor: 'ring-red-300',
      iconBg: 'from-red-100 to-orange-200',
      iconColor: 'text-red-600'
    };
    if (tokens <= 5) return { 
      color: 'text-orange-600', 
      bgColor: 'from-orange-50 to-yellow-50', 
      ringColor: 'ring-orange-200',
      iconBg: 'from-orange-100 to-yellow-100',
      iconColor: 'text-orange-600'
    };
    if (tokens <= 20) return { 
      color: 'text-blue-600', 
      bgColor: 'from-blue-50 to-indigo-50', 
      ringColor: 'ring-blue-200',
      iconBg: 'from-blue-100 to-indigo-100',
      iconColor: 'text-blue-600'
    };
    return { 
      color: 'text-emerald-600', 
      bgColor: 'from-emerald-50 to-green-50', 
      ringColor: 'ring-emerald-200',
      iconBg: 'from-emerald-100 to-green-100',
      iconColor: 'text-emerald-600'
    };
  };

  const sizeClasses = getSizeClasses();

  if (loading) {
    return (
      <div className={`bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 ${sizeClasses.container} animate-pulse`}>
        <div className="flex items-center space-x-3">
          <div className={`bg-gray-200 rounded-full ${sizeClasses.iconContainer}`}></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    const isDatabaseError = error?.includes('Database') || error?.includes('setup');
    
    return (
      <div className={`${isDatabaseError ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} border rounded-xl ${sizeClasses.container}`}>
        <div className="flex items-center space-x-3">
          <div className={`${sizeClasses.iconContainer} ${isDatabaseError ? 'bg-yellow-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
            <Coins className={`${sizeClasses.icon} ${isDatabaseError ? 'text-yellow-600' : 'text-red-500'}`} />
          </div>
          <div className="flex flex-col flex-1">
            <span className={`${isDatabaseError ? 'text-yellow-700' : 'text-red-600'} ${sizeClasses.text} font-medium`}>
              {isDatabaseError ? 'Setup Required' : error || 'Failed to load'}
            </span>
            {isDatabaseError && (
              <span className="text-xs text-yellow-600 mt-1">
                Database configuration needed
              </span>
            )}
          </div>
          {isDatabaseError && (
            <button
              onClick={() => setShowSetupGuide(true)}
              className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-xs transition-colors"
              title="Setup Database"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <DatabaseSetupGuide 
          isOpen={showSetupGuide}
          onClose={() => setShowSetupGuide(false)}
        />
      </div>
    );
  }

  const tokenStatus = getTokenStatus(profile.tokens);

  return (
    <div className="w-full">
      <button
        onClick={onRechargeClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          bg-gradient-to-r ${tokenStatus.bgColor} hover:shadow-lg hover:shadow-indigo-200/50
          rounded-xl border-2 border-transparent hover:border-indigo-300
          ${sizeClasses.container} shadow-sm
          transition-all duration-300 hover:scale-[1.02]
          cursor-pointer group w-full
          ${profile.tokens <= 5 ? `ring-2 ${tokenStatus.ringColor}` : ''}
          ${profile.tokens <= 2 ? 'animate-pulse' : ''}
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        `}
        title={`${profile.tokens} tokens available • Click to add more`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Token Icon */}
            <div className={`
              ${sizeClasses.iconContainer} rounded-full flex items-center justify-center
              bg-gradient-to-r ${tokenStatus.iconBg}
              transition-all duration-300 transform
              ${isHovered ? 'scale-110' : ''}
            `}>
              <Coins className={`${sizeClasses.icon} ${tokenStatus.iconColor}`} />
            </div>

            {/* Token Count */}
            <div className="flex flex-col items-start">
              <div className="flex items-baseline space-x-1">
                <span className={`font-bold ${tokenStatus.color} ${sizeClasses.tokenText} leading-tight`}>
                  {profile.tokens}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  token{profile.tokens !== 1 ? 's' : ''}
                </span>
              </div>
              {showStats && (
                <span className="text-xs text-gray-500 mt-0.5">
                  {profile.total_tokens_used} used
                </span>
              )}
            </div>
          </div>

          {/* Add More Button */}
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300
            ${profile.tokens <= 2 
              ? 'bg-red-200 text-red-700 opacity-100' 
              : profile.tokens <= 5
              ? 'bg-orange-200 text-orange-700 opacity-80 group-hover:opacity-100'
              : 'bg-indigo-200 text-indigo-700 opacity-0 group-hover:opacity-100'
            }
            ${isHovered ? 'scale-110' : ''}
          `}>
            <Plus className="w-3 h-3" />
          </div>
        </div>
      </button>

      {/* Low Token Warning */}
      {profile.tokens <= 5 && (
        <div className="mt-2 p-3 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 border border-orange-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 bg-orange-200 rounded-full flex items-center justify-center">
                {profile.tokens <= 2 ? (
                  <Zap className="w-3 h-3 text-red-600" />
                ) : (
                  <Clock className="w-3 h-3 text-orange-600" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-orange-800">
                {profile.tokens === 0 
                  ? 'Out of tokens!' 
                  : profile.tokens === 1
                  ? 'Last token remaining'
                  : `Only ${profile.tokens} tokens left`
                }
              </p>
              <p className="text-xs text-orange-600 mt-0.5">
                Tap above to recharge and continue creating
              </p>
            </div>
          </div>
        </div>
      )}

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
              <div className={`text-lg font-semibold ${tokenStatus.color}`}>
                {profile.tokens}
              </div>
              <div className="text-xs text-gray-500">Remaining</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenBalanceEnhanced;