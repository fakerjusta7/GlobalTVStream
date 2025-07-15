# IPTV Channel Streaming Platform

## Overview

This is a full-stack IPTV streaming platform built with React/TypeScript frontend and Express.js backend. The application allows users to browse, search, and stream live TV channels from various countries and categories. It features a modern streaming interface with channel management, filtering capabilities, and video playback functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: Radix UI components with shadcn/ui styling system
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple

### Development Environment
- **Development**: Custom Vite middleware integration with Express
- **Hot Module Replacement**: Vite HMR for fast development
- **Error Handling**: Runtime error overlay for development
- **Build Process**: Separate client and server build processes

## Key Components

### Database Schema
Located in `shared/schema.ts`:
- **users**: User authentication and management
- **channels**: TV channel information with streaming URLs, categories, countries
- **favorites**: User favorite channels relationship table

### Storage Layer
The application uses an abstraction layer (`server/storage.ts`) that currently implements in-memory storage but can be easily swapped for database persistence:
- User management operations
- Channel CRUD operations
- Favorites management
- Search and filtering capabilities
- Statistics aggregation

### API Endpoints
- **Channel Management**: CRUD operations for channels
- **M3U Playlist Parsing**: Automatic channel synchronization from M3U playlists
- **Search & Filtering**: Search by name, filter by country/category
- **Statistics**: Country and category statistics for sidebar filtering

### Frontend Components
- **Channel Grid**: Responsive grid layout for channel browsing
- **Video Player Modal**: HLS video streaming with error handling
- **Header**: Search functionality and navigation
- **Sidebar**: Country and category filtering with statistics
- **Responsive Design**: Mobile-first approach with breakpoint-based layouts

## Data Flow

1. **Channel Synchronization**: M3U playlists are parsed and channels are imported into the database
2. **User Interaction**: Users can search, filter, and browse channels through the frontend
3. **Video Streaming**: Selected channels open in a modal with HLS video player
4. **State Management**: TanStack Query handles API calls, caching, and state synchronization
5. **Real-time Updates**: Frontend automatically refetches data when needed

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React ecosystem with Radix UI primitives
- **Styling**: Tailwind CSS with PostCSS processing
- **HTTP Client**: Fetch API with TanStack Query wrapper
- **Video Playback**: HLS.js for HTTP Live Streaming support
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date manipulation

### Backend Dependencies
- **Database**: Neon serverless PostgreSQL
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Session-based authentication with PostgreSQL storage
- **Validation**: Zod for runtime type validation
- **M3U Parsing**: Custom parser for IPTV playlist formats

### Development Dependencies
- **Replit Integration**: Vite plugins for Replit development environment
- **TypeScript**: Full TypeScript support across the stack
- **Build Tools**: esbuild for server bundling, Vite for client bundling

## Deployment Strategy

### Production Build
- **Client**: Vite builds optimized production bundle to `dist/public`
- **Server**: esbuild bundles server code to `dist/index.js`
- **Static Assets**: Client build serves static files through Express

### Environment Configuration
- **Database**: PostgreSQL connection via `DATABASE_URL` environment variable
- **Development**: Development server with HMR and error overlay
- **Production**: Optimized builds with proper error handling

### Scalability Considerations
- **Database**: Uses Neon serverless PostgreSQL for automatic scaling
- **Storage**: Abstracted storage layer allows easy migration to different databases
- **CDN**: Static assets can be served from CDN in production
- **Caching**: TanStack Query provides client-side caching for API responses

The application is designed to be easily deployable on platforms like Replit, Vercel, or traditional hosting providers with minimal configuration changes.