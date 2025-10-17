import React, { useState, useEffect } from 'react';
import { Play, ExternalLink, X, Video, Sparkles, BookOpen } from 'lucide-react';

interface VideoRecommendation {
  title: string;
  url: string;
  videoId: string;
  thumbnail: string;
  source?: string;
}

interface VideoSidebarProps {
  videos: VideoRecommendation[];
  isOpen: boolean;
  onClose: () => void;
  topic?: string;
  category?: string;
  theme?: {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
  };
}

const VideoSidebar: React.FC<VideoSidebarProps> = ({ 
  videos = [], 
  isOpen, 
  onClose, 
  topic,
  category,
  theme = {
    primary: '#8b5cf6',
    secondary: '#7c3aed', 
    background: '#f8fafc',
    accent: '#6366f1'
  }
}) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && videos.length > 0) {
      setSelectedVideo(videos[0]);
    }
  }, [isOpen, videos]);

  const handleVideoSelect = (video: VideoRecommendation) => {
    setSelectedVideo(video);
  };

  const handleWatchVideo = (video: VideoRecommendation) => {
    window.open(video.url, '_blank');
  };

  const getYouTubeEmbedUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}`;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className="fixed right-0 top-0 h-full w-96 shadow-2xl z-50 overflow-hidden flex flex-col transform transition-transform rounded-l-xl border-2"
        style={{
          backgroundColor: 'white',
          borderColor: `${theme.primary}30`
        }}
      >
        {/* Header */}
        <div 
          className="p-4 text-white rounded-tl-xl"
          style={{
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Video Recommendations</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {topic && (
            <p className="text-sm mt-1 text-white text-opacity-80">
              <BookOpen className="w-4 h-4 inline mr-1" />
              Learning: {topic} {category ? `• ${category.replace('_', ' ')}` : ''}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {videos.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-gray-500">
                <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No videos found</p>
                <p className="text-sm">Try generating a roadmap first</p>
              </div>
            </div>
          ) : (
            <>
              {/* Video Player Area */}
              {selectedVideo && (
                <div className="bg-black aspect-video relative">
                  <iframe
                    src={getYouTubeEmbedUrl(selectedVideo.videoId)}
                    title={selectedVideo.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <div className="absolute bottom-2 right-2">
                    <button
                      onClick={() => handleWatchVideo(selectedVideo)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>YouTube</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Selected Video Info */}
              {selectedVideo && (
                <div className="p-4 bg-gray-50 border-b">
                  <h3 className="font-medium text-gray-900 line-clamp-2">
                    {selectedVideo.title}
                  </h3>
                  {(selectedVideo.source === 'ml_recommendation' || selectedVideo.source === 'ml_youtube_api') && (
                    <div className="flex items-center text-sm mt-1" style={{ color: theme.primary }}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      <span>AI Recommended</span>
                    </div>
                  )}
                </div>
              )}

              {/* Video List */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Play className="w-4 h-4 mr-1" />
                    Recommended Videos ({videos.length})
                  </h4>
                  <div className="space-y-3">
                    {videos.map((video, index) => (
                      <div
                        key={video.videoId || index}
                        className={`cursor-pointer rounded-lg border-2 transition-all`}
                        style={{
                          borderColor: selectedVideo?.videoId === video.videoId 
                            ? theme.primary 
                            : '#e5e7eb',
                          backgroundColor: selectedVideo?.videoId === video.videoId 
                            ? `${theme.background}40` 
                            : 'white'
                        }}
                        onClick={() => handleVideoSelect(video)}
                      >
                        <div className="p-3">
                          <div className="flex space-x-3">
                            <div className="flex-shrink-0 relative">
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-20 h-12 object-cover rounded"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded">
                                <Play className="w-4 h-4 text-white" fill="currentColor" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-medium text-gray-900 line-clamp-2">
                                {video.title}
                              </h5>
                              {(video.source === 'ml_recommendation' || video.source === 'ml_youtube_api') && (
                                <div className="flex items-center text-xs mt-1" style={{ color: theme.secondary }}>
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  <span>AI Pick</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-100 border-t">
          <p className="text-xs text-gray-500 text-center">
            Videos curated using machine learning for optimal learning experience
          </p>
        </div>
      </div>
    </>
  );
};

export default VideoSidebar;