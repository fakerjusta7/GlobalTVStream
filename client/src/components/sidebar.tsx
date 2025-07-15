import { useQuery } from "@tanstack/react-query";
import { Globe, Layers, X } from "lucide-react";
import { CountryStats, CategoryStats } from "@shared/schema";

interface SidebarProps {
  isOpen: boolean;
  onCountryFilter: (countryCode: string) => void;
  onCategoryFilter: (category: string) => void;
  selectedCountry: string | null;
  selectedCategory: string | null;
}

const categoryIcons: Record<string, string> = {
  'News': 'fas fa-newspaper',
  'Sports': 'fas fa-football-ball',
  'Entertainment': 'fas fa-film',
  'Music': 'fas fa-music',
  'Kids': 'fas fa-child',
  'Documentary': 'fas fa-book',
  'General': 'fas fa-tv',
  'Movies': 'fas fa-film',
  'Science': 'fas fa-flask',
  'Education': 'fas fa-graduation-cap',
};

export default function Sidebar({ 
  isOpen, 
  onCountryFilter, 
  onCategoryFilter, 
  selectedCountry, 
  selectedCategory 
}: SidebarProps) {
  const { data: countryStats = [] } = useQuery<CountryStats[]>({
    queryKey: ['/api/stats/countries'],
    queryFn: async () => {
      const response = await fetch('/api/stats/countries');
      if (!response.ok) throw new Error('Failed to fetch country stats');
      return response.json();
    },
  });

  const { data: categoryStats = [] } = useQuery<CategoryStats[]>({
    queryKey: ['/api/stats/categories'],
    queryFn: async () => {
      const response = await fetch('/api/stats/categories');
      if (!response.ok) throw new Error('Failed to fetch category stats');
      return response.json();
    },
  });

  const totalChannels = countryStats.reduce((total, country) => total + country.channelCount, 0);
  const onlineChannels = Math.floor(totalChannels * 0.85); // Simulate online percentage

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => {}}
        />
      )}
      
      <aside className={`
        w-64 bg-card-bg min-h-screen p-4 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:block fixed lg:relative
      `}>
        <div className="lg:hidden flex justify-end mb-4">
          <button 
            onClick={() => {}}
            className="p-2 rounded-lg hover:bg-hover-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Country Filter */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Globe className="mr-2 text-streaming-red w-5 h-5" />
              Countries
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {countryStats.slice(0, 20).map((country) => (
                <div 
                  key={country.code}
                  className={`
                    flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors
                    ${selectedCountry === country.code ? 'bg-streaming-red' : 'hover:bg-hover-bg'}
                  `}
                  onClick={() => onCountryFilter(country.code)}
                >
                  <div className="flex items-center space-x-3">
                    <img 
                      src={`https://flagcdn.com/24x18/${country.code.toLowerCase()}.png`}
                      alt={`${country.name} Flag`}
                      className="w-6 h-4"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="text-sm">{country.name}</span>
                  </div>
                  <span className="text-text-secondary text-sm">{country.channelCount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Layers className="mr-2 text-streaming-red w-5 h-5" />
              Categories
            </h3>
            <div className="space-y-2">
              {categoryStats.slice(0, 10).map((category) => (
                <div 
                  key={category.name}
                  className={`
                    flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors
                    ${selectedCategory === category.name ? 'bg-streaming-red' : 'hover:bg-hover-bg'}
                  `}
                  onClick={() => onCategoryFilter(category.name)}
                >
                  <div className="flex items-center space-x-3">
                    <i className={`${categoryIcons[category.name] || 'fas fa-tv'} text-streaming-red`}></i>
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <span className="text-text-secondary text-sm">{category.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-hover-bg rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Channels</span>
                <span className="font-semibold">{totalChannels.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Countries</span>
                <span className="font-semibold">{countryStats.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Online Now</span>
                <span className="font-semibold text-green-400">{onlineChannels.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
