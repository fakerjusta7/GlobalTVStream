import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import ChannelGrid from "@/components/channel-grid";
import VideoPlayerModal from "@/components/video-player-modal";
import { Channel } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Home() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch channels based on filters
  const { data: channels = [], isLoading, error } = useQuery({
    queryKey: ['/api/channels', searchQuery, selectedCountry, selectedCategory],
    queryFn: async () => {
      if (searchQuery) {
        const response = await fetch(`/api/channels/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error('Search failed');
        return response.json();
      }
      
      if (selectedCountry) {
        const response = await fetch(`/api/channels/country/${selectedCountry}`);
        if (!response.ok) throw new Error('Failed to fetch channels by country');
        return response.json();
      }
      
      if (selectedCategory) {
        const response = await fetch(`/api/channels/category/${encodeURIComponent(selectedCategory)}`);
        if (!response.ok) throw new Error('Failed to fetch channels by category');
        return response.json();
      }
      
      const response = await fetch('/api/channels?limit=100');
      if (!response.ok) throw new Error('Failed to fetch channels');
      return response.json();
    },
  });

  // Sync channels on first load
  useEffect(() => {
    const syncChannels = async () => {
      if (channels && channels.length > 0) {
        return; // Don't sync if we already have channels
      }
      
      setIsSyncing(true);
      try {
        const result = await apiRequest('POST', '/api/channels/sync');
        console.log('Sync result:', result);
        // Invalidate the cache to force a refresh
        await queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/stats/countries'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/stats/categories'] });
      } catch (error) {
        console.error('Failed to sync channels:', error);
      } finally {
        setIsSyncing(false);
      }
    };
    
    syncChannels();
  }, [channels]);

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedChannel(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCountry(null);
    setSelectedCategory(null);
  };

  const handleCountryFilter = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSearchQuery("");
    setSelectedCategory(null);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery("");
    setSelectedCountry(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCountry(null);
    setSelectedCategory(null);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Channels</h2>
          <p className="text-text-secondary mb-4">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-streaming-red hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Header 
        onSearch={handleSearch}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        searchQuery={searchQuery}
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={isSidebarOpen}
          onCountryFilter={handleCountryFilter}
          onCategoryFilter={handleCategoryFilter}
          selectedCountry={selectedCountry}
          selectedCategory={selectedCategory}
        />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Active Filters */}
            {(searchQuery || selectedCountry || selectedCategory) && (
              <div className="mb-6 flex items-center gap-4 flex-wrap">
                <span className="text-text-secondary">Active filters:</span>
                {searchQuery && (
                  <div className="bg-card-bg px-3 py-1 rounded-lg flex items-center gap-2">
                    <span className="text-sm">Search: "{searchQuery}"</span>
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="text-text-secondary hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
                {selectedCountry && (
                  <div className="bg-card-bg px-3 py-1 rounded-lg flex items-center gap-2">
                    <span className="text-sm">Country: {selectedCountry}</span>
                    <button 
                      onClick={() => setSelectedCountry(null)}
                      className="text-text-secondary hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
                {selectedCategory && (
                  <div className="bg-card-bg px-3 py-1 rounded-lg flex items-center gap-2">
                    <span className="text-sm">Category: {selectedCategory}</span>
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className="text-text-secondary hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
                <button 
                  onClick={clearFilters}
                  className="text-streaming-red hover:text-red-400 transition-colors text-sm"
                >
                  Clear all
                </button>
              </div>
            )}

            <ChannelGrid 
              channels={channels}
              isLoading={isLoading || isSyncing}
              onChannelSelect={handleChannelSelect}
            />
          </div>
        </main>
      </div>

      {selectedChannel && (
        <VideoPlayerModal 
          channel={selectedChannel}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Legal Disclaimer */}
      <div className="fixed bottom-4 right-4 bg-card-bg border border-gray-700 rounded-lg p-4 max-w-sm text-sm text-text-secondary z-40">
        <p className="mb-2"><strong>Legal Notice:</strong></p>
        <p>This service aggregates publicly available TV streams. We do not host or control the content. Users are responsible for compliance with local laws and regulations.</p>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card-bg border-t border-gray-700 p-4 z-30">
        <div className="flex justify-around">
          <button 
            onClick={() => clearFilters()}
            className="flex flex-col items-center space-y-1 text-streaming-red"
          >
            <i className="fas fa-tv text-xl"></i>
            <span className="text-xs">Live TV</span>
          </button>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center space-y-1 text-text-secondary"
          >
            <i className="fas fa-filter text-xl"></i>
            <span className="text-xs">Filter</span>
          </button>
        </div>
      </div>
    </div>
  );
}
