export interface ParsedChannel {
  name: string;
  streamUrl: string;
  category: string;
  country: string;
  countryCode: string;
  logo?: string;
  language?: string;
  description?: string;
}

export function parseM3U(content: string): ParsedChannel[] {
  const lines = content.split('\n');
  const channels: ParsedChannel[] = [];
  let currentChannel: Partial<ParsedChannel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      // Extract channel name
      const nameMatch = line.match(/#EXTINF:.*?,(.*?)$/);
      if (nameMatch) {
        currentChannel.name = nameMatch[1].trim();
      }

      // Extract attributes
      const attributes = extractAttributes(line);
      
      if (attributes.logo) {
        currentChannel.logo = attributes.logo;
      }
      
      if (attributes.country) {
        const countries = attributes.country.split(';');
        currentChannel.country = countries[0];
        currentChannel.countryCode = countries[0].toLowerCase();
      }
      
      if (attributes.category) {
        currentChannel.category = attributes.category;
      }
      
      if (attributes.language) {
        currentChannel.language = attributes.language;
      }

    } else if (line.startsWith('http')) {
      // This is the stream URL
      currentChannel.streamUrl = line;

      // Set defaults and validate
      if (currentChannel.name && currentChannel.streamUrl) {
        const channel: ParsedChannel = {
          name: currentChannel.name,
          streamUrl: currentChannel.streamUrl,
          category: currentChannel.category || 'General',
          country: currentChannel.country || 'Unknown',
          countryCode: currentChannel.countryCode || 'xx',
          logo: currentChannel.logo,
          language: currentChannel.language || 'en',
          description: currentChannel.description
        };

        channels.push(channel);
      }

      // Reset for next channel
      currentChannel = {};
    }
  }

  return channels;
}

function extractAttributes(line: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  
  // Common attribute patterns
  const patterns = [
    { key: 'logo', pattern: /tvg-logo="([^"]*)"/ },
    { key: 'country', pattern: /tvg-country="([^"]*)"/ },
    { key: 'category', pattern: /group-title="([^"]*)"/ },
    { key: 'language', pattern: /tvg-language="([^"]*)"/ },
    { key: 'id', pattern: /tvg-id="([^"]*)"/ },
    { key: 'name', pattern: /tvg-name="([^"]*)"/ },
  ];

  for (const { key, pattern } of patterns) {
    const match = line.match(pattern);
    if (match) {
      attributes[key] = match[1];
    }
  }

  return attributes;
}

export function validateStreamUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export function categorizeChannel(name: string, groupTitle?: string): string {
  const nameUpper = name.toUpperCase();
  const groupUpper = groupTitle?.toUpperCase() || '';
  
  // News channels
  if (nameUpper.includes('NEWS') || nameUpper.includes('CNN') || nameUpper.includes('BBC') || nameUpper.includes('FOX')) {
    return 'News';
  }
  
  // Sports channels
  if (nameUpper.includes('SPORT') || nameUpper.includes('ESPN') || nameUpper.includes('FOX SPORTS')) {
    return 'Sports';
  }
  
  // Kids channels
  if (nameUpper.includes('KIDS') || nameUpper.includes('CARTOON') || nameUpper.includes('DISNEY')) {
    return 'Kids';
  }
  
  // Music channels
  if (nameUpper.includes('MUSIC') || nameUpper.includes('MTV') || nameUpper.includes('VH1')) {
    return 'Music';
  }
  
  // Movies channels
  if (nameUpper.includes('MOVIE') || nameUpper.includes('CINEMA') || nameUpper.includes('FILM')) {
    return 'Movies';
  }
  
  // Documentary channels
  if (nameUpper.includes('DISCOVERY') || nameUpper.includes('NATIONAL GEOGRAPHIC') || nameUpper.includes('HISTORY')) {
    return 'Documentary';
  }
  
  // Use group title if available
  if (groupTitle) {
    return groupTitle;
  }
  
  return 'General';
}
