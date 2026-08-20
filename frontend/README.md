# YORME-TRICS Frontend

AI-powered class suspension decision support system for Manila LGU - **100% Factual & Open Source Compliant**.

## Overview

This React + Vite frontend provides a real-time dashboard for the YORME-TRICS AI system, allowing officials to:

- **Historical Analysis Mode**: Review factual incidents from 2024 (Typhoon Carina, Habagat surge)
- **Live Watch Mode**: Monitor real-time AI predictions using current system time
- **Live Weather Integration**: Embedded Windy.com meteorological radar for Metro Manila
- **Academic Transparency**: Clear labeling of simulated vs. factual data

## Key Features

### ✅ **100% Factual Data**
- Historical incidents based on actual NDRRMC announcements and PAGASA warnings
- Real announcement times: Carina (July 24, 7:00 AM), Habagat (August 28, 7:00 AM)
- Authentic PAGASA warning progressions from public records

### ✅ **Academic Honesty**
- "Simulated Stranded Projection" clearly labeled as mathematical modeling
- Disclaimer notes explaining RL environment calculations vs. actual data
- No fabricated statistics or misleading dummy data

### ✅ **Live Weather Integration**
- Replaced CCTV feeds with live Windy.com meteorological radar
- Real-time precipitation data over Metro Manila
- ECMWF weather model integration with hourly updates

### ✅ **Mode Separation**
- **Historical Mode**: Analysis of factual 2024 incidents with timeline scrubber
- **Live Mode**: Real-time monitoring bypassing historical data, using current system time

## Environment Setup

### Prerequisites

- Node.js 18+ 
- Package manager: npm, yarn, or pnpm

### Environment Variables

Create a `.env` file in the frontend root:

```bash
# API Configuration - Production
VITE_API_URL=https://walang-pasok-api.onrender.com

# For local development
# VITE_API_URL=http://localhost:8000
```

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture Changes (v2.1 - Factual Compliance)

### Removed Features
- ❌ All CCTV feeds and related infrastructure
- ❌ Fabricated dummy data and mathematical simulation functions
- ❌ Misleading "actual" stranded count statistics
- ❌ Unsplash placeholder images
- ❌ Non-factual incident timelines

### New Features  
- ✅ **Live Weather Radar**: Embedded Windy.com iframe for real meteorological data
- ✅ **Strict Mode Separation**: Historical vs. Live Watch modes with different data sources
- ✅ **Academic Transparency**: Clear labeling of simulated projections vs. factual data
- ✅ **Factual Historical Grounding**: True NDRRMC announcement times and PAGASA warnings
- ✅ **Current Time Integration**: Live mode uses real system time, not simulated timeline

### API Integration

The frontend makes these API calls:

```typescript
// Health check
GET /api/health

// Load factual historical incidents (2024 data)
GET /api/incidents -> IncidentData[]

// Get AI predictions (live or historical)
POST /api/predict -> PredictionResponse
```

### Data Integrity

**Historical Data Sources:**
- Typhoon Carina (July 24, 2024): NDRRMC official announcements, PAGASA warnings
- Habagat Surge (August 28, 2024): Presidential Communications Office records
- PAGASA warning progressions: Public weather bureau archives

**Simulated Data (Clearly Labeled):**
- Stranded count projections: RL environment modeling based on commute density patterns
- Academic disclaimer notes explaining mathematical basis vs. actual unreported data

## Dependencies

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling 
- **Recharts** - Probability charts
- **Lucide React** - Icons
- **Windy.com** - Live weather radar integration

## Production Deployment

The app is optimized for production deployment with:

- ✅ **Factual Compliance**: No fabricated data, clear academic disclaimers
- ✅ **Live Weather Integration**: Real meteorological data from Windy.com
- ✅ **Mode Separation**: Historical analysis vs. live monitoring
- ✅ **Type Safety**: All interfaces match backend exactly
- ✅ **Build Optimization**: Vite production build with code splitting

## Academic Honesty Statement

This dashboard maintains complete academic integrity by:

1. **Factual Historical Data**: All 2024 incidents reflect actual NDRRMC announcements and PAGASA warnings
2. **Clear Simulation Labels**: Stranded count projections explicitly marked as RL environment modeling
3. **Transparent Disclaimers**: Academic notes explaining mathematical basis of projections
4. **No Fabricated Statistics**: Removal of all dummy data that could be mistaken for real figures
5. **Source Attribution**: Links to official government sources where applicable

For deployment, ensure `VITE_API_URL` points to your production backend.