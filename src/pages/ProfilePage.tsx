import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { Camera, User, Mail, Save, AlertCircle, CheckCircle } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(profile.photoURL);

  // Update local state when profile changes
  useEffect(() => {
    setDisplayName(profile.displayName);
    setPreviewImage(profile.photoURL);
  }, [profile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await updateProfile({
        displayName,
        photoURL: previewImage,
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-24 pb-12 px-4 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Profile Settings</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your account settings and profile information</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Profile Picture</h2>
              
              <div className="flex flex-col items-center">
                {/* Profile Picture Display */}
                <div className="relative group">
                  <div className="w-40 h-40 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center overflow-hidden">
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-20 h-20 text-white" />
                    )}
                  </div>
                  
                  {/* Upload Button Overlay */}
                  <label 
                    htmlFor="photo-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                  >
                    <Camera className="w-8 h-8 text-white" />
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 text-center">
                  Click to upload a new photo
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  JPG, PNG or GIF (Max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Profile Information Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Personal Information</h2>

              <div className="space-y-6">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* Account Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Account Type</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">Free</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Member Since</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Message Display */}
                {message && (
                  <div className={`flex items-start space-x-3 p-4 rounded-xl border-2 ${
                    message.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    {message.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <p className={`text-sm font-medium ${
                      message.type === 'success'
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-red-800 dark:text-red-300'
                    }`}>
                      {message.text}
                    </p>
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
