import { useEffect, useRef, useState } from "react";
import { X, Heart, Share2, AlertCircle, Play } from "lucide-react";
import { Channel } from "@shared/schema";
import Hls from "hls.js";

interface VideoPlayerModalProps {
  channel: Channel;
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoPlayerModal({ channel, isOpen, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isOpen && videoRef.current && channel.streamUrl) {
      const video = videoRef.current;
      setIsLoading(true);
      setError(null);
      setIsPlaying(false);
      
      // Check if HLS.js is available
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: false,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferSize: 60 * 1000 * 1000, // 60MB
        });
        
        hls.loadSource(channel.streamUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          video.play().then(() => {
            setIsPlaying(true);
          }).catch((err) => {
            setError('Failed to start playback. Click to try again.');
            console.error('Playback error:', err);
          });
        });
        
        hls.on(Hls.Events.ERROR, (event: any, data: any) => {
          console.error('HLS Error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError('Network error - stream may be temporarily unavailable');
                setTimeout(() => {
                  hls.startLoad();
                }, 1000);
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError('Media error - trying to recover...');
                hls.recoverMediaError();
                break;
              default:
                setError('Stream is currently unavailable');
                setIsLoading(false);
                break;
            }
          }
        });
        
        video.addEventListener('loadstart', () => setIsLoading(true));
        video.addEventListener('canplay', () => setIsLoading(false));
        video.addEventListener('playing', () => setIsPlaying(true));
        video.addEventListener('pause', () => setIsPlaying(false));
        video.addEventListener('error', () => {
          setError('Stream playback failed');
          setIsLoading(false);
        });
        
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        video.src = channel.streamUrl;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          video.play().then(() => {
            setIsPlaying(true);
          }).catch((err) => {
            setError('Failed to start playback. Click to try again.');
            console.error('Playback error:', err);
          });
        });
      } else {
        // Try direct playback for other formats
        video.src = channel.streamUrl;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          video.play().then(() => {
            setIsPlaying(true);
          }).catch((err) => {
            setError('This stream format is not supported in your browser');
            console.error('Playback error:', err);
          });
        });
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isOpen, channel.streamUrl]);

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setIsLoading(false);
    setError(null);
    setIsPlaying(false);
    onClose();
  };

  const handleRetry = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      setIsLoading(true);
      setError(null);
      setIsPlaying(false);
      
      // Cleanup existing player
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      
      // Try to reload the stream
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: false,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferSize: 60 * 1000 * 1000,
        });
        
        hls.loadSource(channel.streamUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          video.play().then(() => {
            setIsPlaying(true);
          }).catch((err) => {
            setError('Failed to start playback. Click to try again.');
          });
        });
        
        hls.on(Hls.Events.ERROR, (event: any, data: any) => {
          if (data.fatal) {
            setError('Stream is currently unavailable');
            setIsLoading(false);
          }
        });
      } else {
        video.src = channel.streamUrl;
        video.play().then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        }).catch((err) => {
          setError('Failed to start playback. Click to try again.');
          setIsLoading(false);
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50">
      <div className="h-full flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-4">
            <img 
              src={`https://flagcdn.com/24x18/${channel.countryCode.toLowerCase()}.png`}
              alt={`${channel.country} Flag`}
              className="w-6 h-4"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h2 className="text-xl font-bold">{channel.name}</h2>
            <span className="bg-streaming-red text-white text-sm px-2 py-1 rounded">
              {channel.isOnline ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-text-secondary hover:text-white transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button className="text-text-secondary hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={handleClose}
              className="text-text-secondary hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video 
                ref={videoRef}
                className="w-full h-auto max-h-[70vh]"
                controls
                playsInline
                poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwMCIgaGVpZ2h0PSI5MDAiIHZpZXdCb3g9IjAgMCAxNjAwIDkwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2MDAiIGhlaWdodD0iOTAwIiBmaWxsPSIjMUExQTFBIi8+CjxjaXJjbGUgY3g9IjgwMCIgY3k9IjQ1MCIgcj0iNjAiIGZpbGw9IiNFNTA5MTQiLz4KPHBhdGggZD0iTTc2MCA0MjBMODQwIDQ1MEw3NjAgNDgwVjQyMFoiIGZpbGw9IndoaXRlIi8+Cjx0ZXh0IHg9IjgwMCIgeT0iNTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjQjNCM0IzIiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iSW50ZXIsIHNhbnMtc2VyaWYiPkNsaWNrIHRvIFBsYXk8L3RleHQ+Cjwvc3ZnPgo="
              />
              
              {/* Loading State */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-streaming-red mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading stream...</p>
                    <p className="text-text-secondary">Please wait</p>
                  </div>
                </div>
              )}
              
              {/* Error State */}
              {error && !isLoading && (
                <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="text-red-400 text-4xl mb-4 mx-auto" size={48} />
                    <p className="text-white text-lg mb-2">Stream Error</p>
                    <p className="text-text-secondary mb-4">{error}</p>
                    <button 
                      onClick={handleRetry}
                      className="bg-streaming-red hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center mx-auto"
                    >
                      <Play className="mr-2" size={16} />
                      Try Again
                    </button>
                  </div>
                </div>
              )}
              
              {/* Offline Channel Message */}
              {!channel.isOnline && !isLoading && !error && (
                <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-red-400 text-4xl mb-4">⚠️</div>
                    <p className="text-white text-lg">Channel is currently offline</p>
                    <p className="text-text-secondary">Please try again later</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Channel Info */}
            <div className="bg-card-bg rounded-lg p-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{channel.name}</h3>
                  <p className="text-text-secondary">
                    {channel.description || `${channel.category} channel from ${channel.country}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary text-sm">Category</p>
                  <p className="font-medium">{channel.category}</p>
                </div>
              </div>
              
              {/* Stream Info */}
              <div className="border-t border-gray-700 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-text-secondary text-sm">Country</p>
                    <p className="font-medium">{channel.country}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm">Language</p>
                    <p className="font-medium">{channel.language || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm">Status</p>
                    <p className={`font-medium ${channel.isOnline ? 'text-green-400' : 'text-red-400'}`}>
                      {channel.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
