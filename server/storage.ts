import { channels, favorites, users, type User, type InsertUser, type Channel, type InsertChannel, type Favorite, type InsertFavorite } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Channel operations
  getChannels(limit?: number, offset?: number): Promise<Channel[]>;
  getChannelById(id: number): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  updateChannel(id: number, channel: Partial<Channel>): Promise<Channel | undefined>;
  deleteChannel(id: number): Promise<boolean>;
  searchChannels(query: string): Promise<Channel[]>;
  getChannelsByCountry(countryCode: string): Promise<Channel[]>;
  getChannelsByCategory(category: string): Promise<Channel[]>;
  getCountryStats(): Promise<Array<{code: string; name: string; channelCount: number}>>;
  getCategoryStats(): Promise<Array<{name: string; count: number}>>;
  
  // Favorites operations
  getFavorites(userId: number): Promise<Channel[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, channelId: number): Promise<boolean>;
  isFavorite(userId: number, channelId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private channels: Map<number, Channel>;
  private favorites: Map<number, Favorite>;
  private userIdCounter: number;
  private channelIdCounter: number;
  private favoriteIdCounter: number;

  constructor() {
    this.users = new Map();
    this.channels = new Map();
    this.favorites = new Map();
    this.userIdCounter = 1;
    this.channelIdCounter = 1;
    this.favoriteIdCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getChannels(limit = 50, offset = 0): Promise<Channel[]> {
    const allChannels = Array.from(this.channels.values());
    return allChannels.slice(offset, offset + limit);
  }

  async getChannelById(id: number): Promise<Channel | undefined> {
    return this.channels.get(id);
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const id = this.channelIdCounter++;
    const channel: Channel = { 
      ...insertChannel, 
      id,
      description: insertChannel.description || null,
      language: insertChannel.language || null,
      logo: insertChannel.logo || null,
      isOnline: insertChannel.isOnline || null
    };
    this.channels.set(id, channel);
    return channel;
  }

  async updateChannel(id: number, channelUpdate: Partial<Channel>): Promise<Channel | undefined> {
    const channel = this.channels.get(id);
    if (!channel) return undefined;
    
    const updatedChannel = { ...channel, ...channelUpdate };
    this.channels.set(id, updatedChannel);
    return updatedChannel;
  }

  async deleteChannel(id: number): Promise<boolean> {
    return this.channels.delete(id);
  }

  async searchChannels(query: string): Promise<Channel[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.channels.values()).filter(
      (channel) =>
        channel.name.toLowerCase().includes(searchTerm) ||
        channel.category.toLowerCase().includes(searchTerm) ||
        channel.country.toLowerCase().includes(searchTerm)
    );
  }

  async getChannelsByCountry(countryCode: string): Promise<Channel[]> {
    return Array.from(this.channels.values()).filter(
      (channel) => channel.countryCode === countryCode
    );
  }

  async getChannelsByCategory(category: string): Promise<Channel[]> {
    return Array.from(this.channels.values()).filter(
      (channel) => channel.category.toLowerCase() === category.toLowerCase()
    );
  }

  async getCountryStats(): Promise<Array<{code: string; name: string; channelCount: number}>> {
    const countryMap = new Map<string, {code: string; name: string; count: number}>();
    
    for (const channel of Array.from(this.channels.values())) {
      const existing = countryMap.get(channel.countryCode);
      if (existing) {
        existing.count++;
      } else {
        countryMap.set(channel.countryCode, {
          code: channel.countryCode,
          name: channel.country,
          count: 1
        });
      }
    }
    
    return Array.from(countryMap.values())
      .map(({code, name, count}) => ({code, name, channelCount: count}))
      .sort((a, b) => b.channelCount - a.channelCount);
  }

  async getCategoryStats(): Promise<Array<{name: string; count: number}>> {
    const categoryMap = new Map<string, number>();
    
    for (const channel of Array.from(this.channels.values())) {
      const existing = categoryMap.get(channel.category);
      categoryMap.set(channel.category, (existing || 0) + 1);
    }
    
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({name, count}))
      .sort((a, b) => b.count - a.count);
  }

  async getFavorites(userId: number): Promise<Channel[]> {
    const userFavorites = Array.from(this.favorites.values()).filter(
      (fav) => fav.userId === userId
    );
    
    const favoriteChannels: Channel[] = [];
    for (const favorite of userFavorites) {
      const channel = this.channels.get(favorite.channelId!);
      if (channel) {
        favoriteChannels.push(channel);
      }
    }
    
    return favoriteChannels;
  }

  async addFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = this.favoriteIdCounter++;
    const favorite: Favorite = { 
      id, 
      userId: insertFavorite.userId || null,
      channelId: insertFavorite.channelId || null
    };
    this.favorites.set(id, favorite);
    return favorite;
  }

  async removeFavorite(userId: number, channelId: number): Promise<boolean> {
    const favoriteEntry = Array.from(this.favorites.entries()).find(
      ([_, fav]) => fav.userId === userId && fav.channelId === channelId
    );
    
    if (favoriteEntry) {
      return this.favorites.delete(favoriteEntry[0]);
    }
    
    return false;
  }

  async isFavorite(userId: number, channelId: number): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      (fav) => fav.userId === userId && fav.channelId === channelId
    );
  }
}

export const storage = new MemStorage();
