# Drone Simulator v2

A modern, production-ready drone flight simulator built with React Three Fiber, TypeScript, and Vite. This simulator provides comprehensive 3D visualization and analysis tools for drone telemetry data with an intuitive timeline-based interface.

## 🚁 Features

- **3D Drone Visualization**: Realistic drone model with animated rotors and physics-based movement
- **Multi-Drone Support**: Load and manage multiple drone datasets simultaneously
- **Advanced Timeline Controls**: Comprehensive playback controls with markers, zoom, and synchronization
- **Flight Path Analysis**: Visualize complete flight paths with customizable colors and opacity
- **Real-time Telemetry**: Position, rotation, and time information display with precision formatting
- **Scene Controls**: Toggle grid, axes, flight paths, and camera modes
- **Synchronization Tools**: Align multiple drone timelines for comparative analysis
- **Responsive UI**: Modern, clean interface that adapts to different screen sizes
- **Performance Optimized**: Efficient rendering and data handling for large datasets

## 🛠 Technology Stack

- **Frontend Framework**: React 18 + TypeScript
- **3D Graphics**: Three.js + React Three Fiber + Drei
- **Build Tool**: Vite 7.x
- **Styling**: Modern CSS with component-based architecture
- **Data Format**: CSV telemetry files
- **State Management**: Custom React hooks with efficient data structures

## 🚀 Getting Started

### Prerequisites

- Node.js (v20.19.0+ or v22.12.0+ recommended)
- npm (v10.5.0 or higher)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/fivepointfire/Drone-Simulator.git
   cd Drone-Simulator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory. You can serve them using:

```bash
# Using Python (recommended for local testing)
cd dist
python -m http.server 8000 --bind 127.0.0.1

# Or using any static file server
npx serve dist
```

## 📊 CSV Data Format

The simulator expects CSV files with the following columns:

- `elapsed_time` or `time`: Time in seconds
- `drone_x` or `x`: X position (meters)
- `drone_y` or `y`: Y position (meters)
- `drone_z` or `z`: Z position (meters)
- `drone_roll` or `roll`: Roll rotation (radians)
- `drone_pitch` or `pitch`: Pitch rotation (radians)
- `drone_yaw` or `yaw`: Yaw rotation (radians)

**Example CSV format**:
```csv
elapsed_time,drone_x,drone_y,drone_z,drone_roll,drone_pitch,drone_yaw
0.0,0.0,0.0,0.0,0.0,0.0,0.0
0.1,0.1,0.0,0.1,0.01,0.02,0.05
0.2,0.2,0.0,0.2,0.02,0.04,0.10
```

## 🎮 Controls & Usage

### File Management
- **Upload CSV**: Use the "Choose CSV File" button to load drone telemetry
- **Multiple Drones**: Load multiple CSV files to compare flight paths
- **Drone Selection**: Click on drone entries to set as active or toggle visibility

### Playback Controls
- **Play/Pause**: Space bar or play button
- **Timeline Scrubbing**: Click and drag on the timeline
- **Speed Control**: Adjust playback speed (0.25x to 4x)
- **Loop Mode**: Enable continuous playback
- **Markers**: Shift+Click on timeline to add markers

### Camera Controls
- **Orbit**: Left mouse drag to rotate camera
- **Pan**: Right mouse drag or Shift+drag
- **Zoom**: Mouse wheel or pinch gesture
- **Camera Modes**: Free, Follow, or Orbit drone

### Scene Options
- **Grid**: Toggle coordinate grid display
- **Axes**: Show/hide coordinate axes
- **Flight Paths**: Toggle path visualization
- **Scale Factor**: Adjust world scale (50x to 500x)

## 📁 Project Structure

```
src/
├── components/
│   ├── Layout/
│   │   └── AppLayout.tsx           # Main application layout
│   ├── Panels/
│   │   ├── ControlPanel.tsx        # Drone management and controls
│   │   ├── SceneControls.tsx       # Scene configuration options
│   │   └── SyncControls.tsx        # Multi-drone synchronization
│   ├── Timeline/
│   │   └── TimelinePanel.tsx       # Advanced timeline interface
│   ├── Drone.tsx                   # 3D drone model component
│   ├── SceneComponents.tsx         # Grid, axes, flight paths
│   └── StatsDisplay.tsx            # Real-time telemetry display
├── hooks/
│   ├── useDroneManager.ts          # Multi-drone state management
│   ├── useSimulation.ts            # Simulation logic and playback
│   └── useTimeline.ts              # Timeline controls and markers
├── types/
│   ├── DroneTypes.ts               # Drone data interfaces
│   └── TimelineTypes.ts            # Timeline and marker types
├── utils/
│   └── csvLoader.ts                # CSV parsing and data processing
├── App.tsx                         # Main application component
├── App.css                         # Application styles
└── main.tsx                        # Application entry point
```

## 🔧 Recent Updates

### Version 2.1.0 (Latest)
- ✅ **Fixed TypeScript compilation errors**: Resolved all TS issues for clean builds
- ✅ **Dependency updates**: Added missing `terser` for production builds
- ✅ **Code optimization**: Removed unused imports and variables
- ✅ **Type safety improvements**: Enhanced type definitions and error handling
- ✅ **Build system**: Optimized Vite configuration for better performance

## ⚡ Performance Features

- **Efficient Data Structures**: Binary search for frame lookup (O(log n))
- **Memoized Geometries**: Three.js objects cached for optimal rendering
- **Lazy Loading**: Components loaded on demand
- **Optimized Builds**: Code splitting and minification
- **Memory Management**: Proper cleanup of animation frames and event listeners

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**WebGL 2.0 required** for optimal 3D performance.

## 🚨 Troubleshooting

### Build Issues
- **Node.js Version**: Ensure you're using Node.js 20.19.0+ or 22.12.0+
- **Dependencies**: Run `npm install` to ensure all dependencies are installed
- **Terser Error**: The build process automatically installs terser if missing

### Performance Issues
- **Large Datasets**: Consider reducing timeline zoom for datasets with >10,000 frames
- **Multiple Drones**: Hide unused drones to improve rendering performance
- **Memory**: Refresh the page if memory usage becomes high with large files

### File Loading Issues
- **CSV Format**: Ensure your CSV has the required columns
- **File Size**: Large files (>100MB) may take time to process
- **Browser Limits**: Some browsers limit file sizes; use smaller chunks if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is part of a drone simulation system and is intended for educational and research purposes.

## 🔗 Repository

**GitHub**: [https://github.com/fivepointfire/Drone-Simulator.git](https://github.com/fivepointfire/Drone-Simulator.git)

---

**Built with ❤️ using React Three Fiber and TypeScript**