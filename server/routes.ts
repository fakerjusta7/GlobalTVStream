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
        
        if (logoMatch) currentChannel.logo = logoMatch[1];
        if (countryMatch) {
          const countries = countryMatch[1].split(';');
          currentChannel.country = countries[0];
          currentChannel.countryCode = countries[0].toLowerCase();
        }
        if (categoryMatch) currentChannel.category = categoryMatch[1];
        
      } else if (line.startsWith('http')) {
        // This is the stream URL
        currentChannel.streamUrl = line;
        currentChannel.isOnline = true;
        currentChannel.language = 'en';
        
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
