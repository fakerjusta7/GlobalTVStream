import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertChannelSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // M3U Parser utility
  function parseM3U(content: string) {
    const lines = content.split('\n');
    const channels = [];
    let currentChannel: any = {};
    
    // Country code to country name mapping
    const countryMap: { [key: string]: string } = {
      'us': 'United States', 'uk': 'United Kingdom', 'ca': 'Canada', 'au': 'Australia',
      'de': 'Germany', 'fr': 'France', 'es': 'Spain', 'it': 'Italy', 'nl': 'Netherlands',
      'be': 'Belgium', 'ch': 'Switzerland', 'at': 'Austria', 'se': 'Sweden', 'no': 'Norway',
      'dk': 'Denmark', 'fi': 'Finland', 'pl': 'Poland', 'cz': 'Czech Republic', 'sk': 'Slovakia',
      'hu': 'Hungary', 'ro': 'Romania', 'bg': 'Bulgaria', 'hr': 'Croatia', 'si': 'Slovenia',
      'rs': 'Serbia', 'ba': 'Bosnia and Herzegovina', 'me': 'Montenegro', 'mk': 'North Macedonia',
      'al': 'Albania', 'gr': 'Greece', 'tr': 'Turkey', 'ru': 'Russia', 'ua': 'Ukraine',
      'by': 'Belarus', 'lt': 'Lithuania', 'lv': 'Latvia', 'ee': 'Estonia', 'is': 'Iceland',
      'ie': 'Ireland', 'pt': 'Portugal', 'mx': 'Mexico', 'br': 'Brazil', 'ar': 'Argentina',
      'cl': 'Chile', 'co': 'Colombia', 'pe': 'Peru', 've': 'Venezuela', 'ec': 'Ecuador',
      'uy': 'Uruguay', 'py': 'Paraguay', 'bo': 'Bolivia', 'jp': 'Japan', 'kr': 'South Korea',
      'cn': 'China', 'tw': 'Taiwan', 'hk': 'Hong Kong', 'sg': 'Singapore', 'th': 'Thailand',
      'my': 'Malaysia', 'id': 'Indonesia', 'ph': 'Philippines', 'vn': 'Vietnam', 'in': 'India',
      'pk': 'Pakistan', 'bd': 'Bangladesh', 'lk': 'Sri Lanka', 'af': 'Afghanistan', 'ir': 'Iran',
      'iq': 'Iraq', 'il': 'Israel', 'ps': 'Palestine', 'jo': 'Jordan', 'lb': 'Lebanon',
      'sy': 'Syria', 'sa': 'Saudi Arabia', 'ae': 'United Arab Emirates', 'kw': 'Kuwait',
      'qa': 'Qatar', 'bh': 'Bahrain', 'om': 'Oman', 'ye': 'Yemen', 'eg': 'Egypt',
      'ly': 'Libya', 'tn': 'Tunisia', 'dz': 'Algeria', 'ma': 'Morocco', 'sd': 'Sudan',
      'et': 'Ethiopia', 'ke': 'Kenya', 'tz': 'Tanzania', 'ug': 'Uganda', 'rw': 'Rwanda',
      'za': 'South Africa', 'ng': 'Nigeria', 'gh': 'Ghana', 'ci': 'Côte d\'Ivoire',
      'sn': 'Senegal', 'ml': 'Mali', 'bf': 'Burkina Faso', 'ne': 'Niger', 'td': 'Chad',
      'cm': 'Cameroon', 'ga': 'Gabon', 'cg': 'Republic of the Congo', 'cd': 'Democratic Republic of the Congo',
      'ao': 'Angola', 'zm': 'Zambia', 'zw': 'Zimbabwe', 'bw': 'Botswana', 'na': 'Namibia',
      'sz': 'Eswatini', 'ls': 'Lesotho', 'mg': 'Madagascar', 'mu': 'Mauritius', 'sc': 'Seychelles'
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXTINF:')) {
        // Parse channel info from EXTINF line
        const match = line.match(/#EXTINF:.*?,(.*?)$/);
        if (match) {
          currentChannel.name = match[1].trim();
        }
        
        // Extract additional info from attributes
        const logoMatch = line.match(/tvg-logo="([^"]*)"/);
        const countryMatch = line.match(/tvg-country="([^"]*)"/);
        const categoryMatch = line.match(/group-title="([^"]*)"/);
        const idMatch = line.match(/tvg-id="([^"]*)"/);
        
        if (logoMatch) currentChannel.logo = logoMatch[1];
        if (categoryMatch) currentChannel.category = categoryMatch[1];
        
        // Enhanced country detection
        let countryDetected = false;
        
        // First try tvg-country attribute
        if (countryMatch) {
          const countryValue = countryMatch[1].toLowerCase().trim();
          if (countryMap[countryValue]) {
            currentChannel.countryCode = countryValue;
            currentChannel.country = countryMap[countryValue];
            countryDetected = true;
          }
        }
        
        // If no country found, try to extract from tvg-id (e.g. "1TV.af@SD" -> "af")
        if (!countryDetected && idMatch) {
          const idValue = idMatch[1];
          const countryCodeMatch = idValue.match(/\.([a-z]{2})(@|$)/);
          if (countryCodeMatch) {
            const countryCode = countryCodeMatch[1];
            if (countryMap[countryCode]) {
              currentChannel.countryCode = countryCode;
              currentChannel.country = countryMap[countryCode];
              countryDetected = true;
            }
          }
        }
        
        // If still no country, try to extract from channel name
        if (!countryDetected) {
          const channelName = currentChannel.name?.toLowerCase() || '';
          let foundCountry = null;
          
          // Check for country names or codes in channel name
          for (const [code, name] of Object.entries(countryMap)) {
            if (channelName.includes(name.toLowerCase()) || 
                channelName.includes(code + ' ') || 
                channelName.includes(' ' + code) ||
                channelName.startsWith(code + ' ') ||
                channelName.endsWith(' ' + code)) {
              foundCountry = { code, name };
              break;
            }
          }
          
          if (foundCountry) {
            currentChannel.countryCode = foundCountry.code;
            currentChannel.country = foundCountry.name;
            countryDetected = true;
          }
        }
        
        // Default to Unknown if no country detected
        if (!countryDetected) {
          currentChannel.countryCode = 'xx';
          currentChannel.country = 'Unknown';
        }
        
      } else if (line.startsWith('http')) {
        // This is the stream URL
        currentChannel.streamUrl = line;
        currentChannel.isOnline = true;
        currentChannel.language = 'en';
        currentChannel.description = null;
        
        // Set defaults if not found
        if (!currentChannel.category) currentChannel.category = 'General';
        if (!currentChannel.country) currentChannel.country = 'Unknown';
        if (!currentChannel.countryCode) currentChannel.countryCode = 'xx';
        
        channels.push({...currentChannel});
        currentChannel = {};
      }
    }
    
    return channels;
  }

  // Fetch and populate channels from IPTV-org
  app.post("/api/channels/sync", async (req, res) => {
    try {
      const response = await fetch('https://iptv-org.github.io/iptv/index.m3u');
      if (!response.ok) {
        throw new Error('Failed to fetch IPTV playlist');
      }
      
      const m3uContent = await response.text();
      const parsedChannels = parseM3U(m3uContent);
      
      // Clear existing channels and add new ones
      const existingChannels = await storage.getChannels(10000, 0);
      for (const channel of existingChannels) {
        await storage.deleteChannel(channel.id);
      }
      
      const addedChannels = [];
      for (const channelData of parsedChannels.slice(0, 1000)) { // Limit to 1000 channels
        try {
          const validatedChannel = insertChannelSchema.parse(channelData);
          const channel = await storage.createChannel(validatedChannel);
          addedChannels.push(channel);
        } catch (error) {
          console.error('Invalid channel data:', error);
        }
      }
      
      res.json({ 
        message: 'Channels synchronized successfully',
        count: addedChannels.length 
      });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({ 
        message: 'Failed to sync channels',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get channels with pagination
  app.get("/api/channels", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const channels = await storage.getChannels(limit, offset);
      res.json(channels);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch channels',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Search channels
  app.get("/api/channels/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const channels = await storage.searchChannels(query);
      res.json(channels);
    } catch (error) {
      res.status(500).json({ 
        message: 'Search failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get channels by country
  app.get("/api/channels/country/:countryCode", async (req, res) => {
    try {
      const { countryCode } = req.params;
      const channels = await storage.getChannelsByCountry(countryCode);
      res.json(channels);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch channels by country',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get channels by category
  app.get("/api/channels/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const channels = await storage.getChannelsByCategory(category);
      res.json(channels);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch channels by category',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get country statistics
  app.get("/api/stats/countries", async (req, res) => {
    try {
      const stats = await storage.getCountryStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch country stats',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get category statistics
  app.get("/api/stats/categories", async (req, res) => {
    try {
      const stats = await storage.getCategoryStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch category stats',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get channel by ID
  app.get("/api/channels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const channel = await storage.getChannelById(id);
      
      if (!channel) {
        return res.status(404).json({ message: 'Channel not found' });
      }
      
      res.json(channel);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch channel',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
