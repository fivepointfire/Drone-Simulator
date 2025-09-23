# Drone Simulator v2

A modern, production-ready drone flight simulator built with React Three Fiber, TypeScript, and Vite.

## Features

- **3D Drone Visualization**: Realistic drone model with animated rotors
- **Flight Path Replay**: Load and replay drone telemetry from CSV files
- **Interactive Controls**: Play/pause, seek, and time controls
- **Real-time Stats**: Position, rotation, and time information display
- **Modern UI**: Clean, responsive interface with smooth animations
- **Performance Optimized**: Built with Vite for fast development and optimized production builds

## Technology Stack

- **Frontend Framework**: React 18 + TypeScript
- **3D Graphics**: Three.js + React Three Fiber + Drei
- **Build Tool**: Vite
- **Styling**: Modern CSS with custom components
- **Data Format**: CSV telemetry files

## Getting Started

### Prerequisites

- Node.js (v20.15.0 or higher)
- npm (v10.5.0 or higher)

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd dronesimv2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## CSV Data Format

The simulator expects CSV files with the following columns:

- `elapsed_time`: Time in seconds
- `drone_x`: X position
- `drone_y`: Y position  
- `drone_z`: Z position
- `drone_roll`: Roll rotation (radians)
- `drone_pitch`: Pitch rotation (radians)
- `drone_yaw`: Yaw rotation (radians)

Place your CSV files in the `public` directory and update the `csvFileName` in `src/App.tsx`.

## Controls

- **Mouse**: Orbit camera around the scene
- **Scroll**: Zoom in/out
- **Play/Pause**: Control simulation playback
- **Time Slider**: Seek to any point in the flight
- **Stats Panel**: View real-time telemetry data

## Project Structure

```
src/
├── components/          # React components
│   ├── Drone.tsx       # 3D drone model
│   ├── SceneComponents.tsx  # Grid, axes, flight path
│   ├── PlaybackControls.tsx # UI controls
│   └── StatsDisplay.tsx     # Telemetry display
├── hooks/              # Custom React hooks
│   └── useSimulation.ts    # Simulation state management
├── types/              # TypeScript type definitions
│   └── DroneTypes.ts       # Drone data interfaces
├── utils/              # Utility functions
│   └── csvLoader.ts        # CSV parsing and data loading
├── App.tsx             # Main application component
├── App.css             # Application styles
└── index.css           # Global styles
```

## Performance Notes

- The simulator uses efficient binary search for frame lookup
- Three.js geometries are memoized for optimal performance
- Vite provides hot module replacement for fast development
- Production builds are optimized with code splitting and minification

## License

This project is part of a drone simulation system and is intended for educational and research purposes.