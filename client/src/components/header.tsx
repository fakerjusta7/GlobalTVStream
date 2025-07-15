import { useState } from "react";
import { Search, Tv, Menu, X } from "lucide-react";

interface HeaderProps {
  onSearch: (query: string) => void;
  onToggleSidebar: () => void;
  searchQuery: string;
}

export default function Header({ onSearch, onToggleSidebar, searchQuery }: HeaderProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
    // Debounced search
    const timeoutId = setTimeout(() => {
      onSearch(e.target.value);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  return (
    <header className="sticky top-0 z-50 bg-dark-bg/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Tv className="text-streaming-red text-2xl" />
              <h1 className="text-2xl font-bold">GlobalTV</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-white hover:text-streaming-red transition-colors">Live TV</a>
              <a href="#" className="text-text-secondary hover:text-white transition-colors">Categories</a>
              <a href="#" className="text-text-secondary hover:text-white transition-colors">Favorites</a>
              <a href="#" className="text-text-secondary hover:text-white transition-colors">EPG</a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input 
                type="text" 
                placeholder="Search channels..." 
                value={localSearchQuery}
                onChange={handleSearchChange}
                className="w-64 bg-card-bg border border-gray-700 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:border-streaming-red transition-colors"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
            </form>
            
            <button 
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-hover-bg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
