import { Play, Heart } from "lucide-react";
import { Channel } from "@shared/schema";

interface ChannelGridProps {
  channels: Channel[];
  isLoading: boolean;
  onChannelSelect: (channel: Channel) => void;
}

export default function ChannelGrid({ channels, isLoading, onChannelSelect }: ChannelGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {Array.from({ length: 20 }).map((_, index) => (
          <div key={index} className="bg-card-bg rounded-lg overflow-hidden animate-pulse">
            <div className="w-full h-32 bg-gray-700"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl text-text-secondary mb-4">📺</div>
        <h3 className="text-xl font-semibold mb-2">No channels found</h3>
        <p className="text-text-secondary">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Featured Channels */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <i className="fas fa-star mr-2 text-streaming-red"></i>
          Featured Channels
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {channels.slice(0, 8).map((channel) => (
            <div 
              key={channel.id}
              className="bg-card-bg rounded-lg overflow-hidden hover:bg-hover-bg transition-colors cursor-pointer group"
              onClick={() => onChannelSelect(channel)}
            >
              <div className="relative">
                <div className="w-full h-32 bg-gray-700 flex items-center justify-center">
                  {channel.logo ? (
                    <img 
                      src={channel.logo} 
                      alt={channel.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-4xl text-text-secondary">📺</div>
                  )}
                </div>
                <div className="absolute top-2 left-2 flex items-center space-x-2">
                  <img 
                    src={`https://flagcdn.com/24x18/${channel.countryCode.toLowerCase()}.png`}
                    alt={`${channel.country} Flag`}
                    className="w-6 h-4"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="bg-streaming-red text-white text-xs px-2 py-1 rounded">
                    {channel.isOnline ? 'LIVE' : 'OFFLINE'}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Play className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 truncate">{channel.name}</h3>
                <p className="text-text-secondary text-sm mb-2">{channel.category}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${channel.isOnline ? 'text-green-400' : 'text-red-400'}`}>
                    ● {channel.isOnline ? 'Online' : 'Offline'}
                  </span>
                  <button className="text-text-secondary hover:text-white transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* All Channels */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">All Channels</h2>
          <div className="flex items-center space-x-4">
            <select className="bg-card-bg border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-streaming-red">
              <option>All Categories</option>
              <option>News</option>
              <option>Sports</option>
              <option>Entertainment</option>
              <option>Music</option>
              <option>Kids</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {channels.map((channel) => (
            <div 
              key={channel.id}
              className="bg-card-bg rounded-lg overflow-hidden hover:bg-hover-bg transition-colors cursor-pointer group"
              onClick={() => onChannelSelect(channel)}
            >
              <div className="relative">
                <div className="w-full h-24 bg-gray-700 flex items-center justify-center">
                  {channel.logo ? (
                    <img 
                      src={channel.logo} 
                      alt={channel.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-2xl text-text-secondary">📺</div>
                  )}
                </div>
                <div className="absolute top-1 left-1 flex items-center space-x-1">
                  <img 
                    src={`https://flagcdn.com/16x12/${channel.countryCode.toLowerCase()}.png`}
                    alt={`${channel.country} Flag`}
                    className="w-4 h-3"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="bg-streaming-red text-white text-xs px-1 py-0.5 rounded">
                    {channel.isOnline ? 'LIVE' : 'OFF'}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Play className="text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm mb-1 truncate">{channel.name}</h3>
                <p className="text-text-secondary text-xs mb-2">{channel.category}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${channel.isOnline ? 'text-green-400' : 'text-red-400'}`}>
                    ● {channel.isOnline ? 'Online' : 'Offline'}
                  </span>
                  <button className="text-text-secondary hover:text-white transition-colors text-xs">
                    <Heart className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
