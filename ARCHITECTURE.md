# Architecture Document: Tesla Dashcam Web Viewer

## Overview

This document describes the architecture for a pure JavaScript web application that provides synchronized playback of Tesla dashcam footage with embedded telemetry data overlay. The application operates entirely client-side in the browser with no server backend.

## Design Philosophy

### Privacy First
All video files and metadata remain on the user's local machine. Files are accessed via browser File API and processed in-memory without any network transmission.

### Zero Installation
The application runs as static HTML/CSS/JavaScript files that can be opened directly in a browser or served from any static web host.

### Tesla Compatibility
Leverages Tesla's open-source dashcam tools and Protocol Buffer specifications to ensure compatibility with official formats.

## System Architecture

### Three-Layer Architecture

**1. File Management Layer**
Handles local file selection, validation, and grouping of related camera files by timestamp.

**2. Data Processing Layer**
Parses MP4 container format, extracts SEI metadata, deserializes Protocol Buffer data, and indexes telemetry by frame/timestamp.

**3. Presentation Layer**
Manages video playback, telemetry overlay rendering, UI controls, and multi-camera synchronization.

## Core Components

### Component 1: File Loader
**Purpose**: Accept Tesla dashcam video files from user's local filesystem

**Responsibilities**:
- Provide file selection interface (input element or drag-and-drop zone)
- Validate files are MP4 format
- Parse filename timestamps to identify related camera angles
- Group files by event timestamp (same YYYY-MM-DD_HH-MM-SS prefix)
- Create object URLs for video playback
- Handle multiple file selection for multi-camera events

**Inputs**: User file selection via browser File API
**Outputs**: File objects grouped by timestamp, ready for processing

### Component 2: MP4 Parser
**Purpose**: Extract SEI metadata from MP4 video container structure

**Responsibilities**:
- Parse MP4 box/atom structure (ftyp, moov, mdat, etc.)
- Locate SEI NAL units within H.264/H.265 video stream
- Extract raw SEI payload bytes without full video decode
- Handle both H.264 and H.265 codec variations
- Support chunked/streaming parsing to avoid loading entire file into memory
- Detect if video contains SEI data or provide fallback message

**Inputs**: MP4 file as ArrayBuffer or Blob
**Outputs**: Array of raw SEI data payloads with associated frame numbers or timestamps

**Reference**: Can leverage Tesla's `dashcam-mp4.js` library or implement custom parser

### Component 3: Protocol Buffer Decoder
**Purpose**: Deserialize SEI binary data into structured telemetry objects

**Responsibilities**:
- Load Tesla's `dashcam.proto` Protocol Buffer schema
- Deserialize raw SEI bytes into structured JavaScript objects
- Handle protobuf versioning (SEI version field)
- Convert units where needed (e.g., m/s to mph/kph)
- Build telemetry index mapping video time to data points

**Inputs**: Raw SEI payload bytes, dashcam.proto schema
**Outputs**: Structured telemetry objects with fields like speed, steering angle, GPS, etc.

**Technology**: protobuf.js library for browser-based Protocol Buffer handling

### Component 4: Video Player Manager
**Purpose**: Coordinate synchronized playback across multiple camera angles

**Responsibilities**:
- Manage multiple HTML5 video elements (one per camera angle)
- Synchronize playback timing across all cameras
- Handle play/pause/seek controls globally
- Maintain playback state (current time, duration, playing status)
- Provide timeline scrubbing interface
- Handle video buffering and loading states
- Manage playback speed controls
- Detect and handle synchronization drift between cameras

**Inputs**: Video object URLs for each camera angle
**Outputs**: Synchronized video playback with current time updates

### Component 5: Telemetry Overlay Renderer
**Purpose**: Display real-time telemetry data synchronized with video playback

**Responsibilities**:
- Listen to video playback time updates
- Query telemetry index for data at current playback time
- Render telemetry UI overlay (speed, turn signals, Autopilot status, etc.)
- Update overlay in real-time as video plays
- Provide toggle to show/hide overlay
- Handle missing telemetry data gracefully
- Format telemetry values for display (units, precision)

**Rendering Options**:
- Canvas overlay on video
- HTML/CSS positioned overlay
- SVG graphics for gauges/indicators

**Displayed Telemetry**:
- Vehicle speed (with unit selection: mph/kph)
- Steering wheel angle visualization
- Turn signal indicators (left/right arrows)
- Brake/accelerator pedal position (bar graphs or percentages)
- Autopilot/FSD status badge
- GPS coordinates and heading
- Gear indicator (P/R/N/D)
- Acceleration values
- Timestamp/frame number

### Component 6: Camera Layout Manager
**Purpose**: Arrange multiple camera views in configurable layouts

**Responsibilities**:
- Provide layout options (grid, picture-in-picture, single view, etc.)
- Handle responsive sizing for different screen sizes
- Allow user to select which cameras to display
- Support fullscreen mode
- Manage aspect ratios for each camera view
- Provide camera labels (Front, Rear, Left, Right, B-Pillar L/R)

**Layout Options**:
- Single camera (full screen with camera selector)
- 2x2 grid (four cameras)
- 3x2 grid (six cameras)
- Primary + thumbnails (one large, others small)
- Side-by-side comparison

### Component 7: Timeline/Scrubber
**Purpose**: Provide visual timeline navigation with telemetry preview

**Responsibilities**:
- Display playback progress bar
- Allow seeking by clicking/dragging on timeline
- Show buffered regions
- Display thumbnail previews on hover
- Optionally show telemetry graphs (speed over time, etc.)
- Mark events (hard braking, turns, Autopilot engage/disengage)

**Advanced Features**:
- Mini speed graph along timeline
- Event markers for significant telemetry changes
- Thumbnail strip from video frames

### Component 8: User Interface Controls
**Purpose**: Provide intuitive controls for all viewer functionality

**Responsibilities**:
- File selection area (drag-and-drop or button)
- Playback controls (play/pause, timeline, volume, speed)
- Camera selection and layout switching
- Telemetry overlay toggle and configuration
- Settings panel (units, overlay style, etc.)
- Export functionality (save telemetry as JSON/CSV)
- Help/documentation overlay
- Error messages and loading states

## Data Flow

### Loading Phase
1. User selects MP4 files via file picker or drag-and-drop
2. File Loader validates and groups files by timestamp
3. Object URLs created for video elements
4. MP4 Parser extracts SEI metadata from each file
5. Protocol Buffer Decoder deserializes SEI into telemetry objects
6. Telemetry index built (frame number → telemetry data map)

### Playback Phase
1. Video Player Manager initiates playback across all camera angles
2. Video elements fire timeupdate events during playback
3. Telemetry Overlay queries index for data at current time
4. Overlay UI updates with current telemetry values
5. Timeline/Scrubber shows progress and allows seeking
6. User interactions update playback state globally

### Export Phase (Optional)
1. User requests telemetry export
2. Telemetry data serialized to JSON or CSV format
3. Download triggered via browser download API

## Technical Considerations

### Performance Optimization
- Use Web Workers for MP4 parsing to avoid blocking UI thread
- Implement lazy loading for multi-camera scenarios
- Stream/chunk large MP4 files rather than loading entirely into memory
- Cache parsed telemetry data in memory for instant seeking
- Debounce overlay updates to avoid excessive DOM manipulation

### Error Handling
- Gracefully handle videos without SEI data (show warning)
- Detect incompatible video codecs and inform user
- Handle corrupted MP4 files with clear error messages
- Provide fallback for older firmware videos without telemetry

### Browser Compatibility
- Feature detection for File API, Video API support
- Codec detection for H.265/HEVC support
- Polyfills where appropriate (though modern browsers preferred)
- Clear messaging if browser lacks required features

### Data Synchronization
- MP4 files from same event share timestamp prefix in filename
- Video elements synchronized by monitoring timeupdate events
- If drift detected, programmatically adjust video.currentTime
- Telemetry lookup uses video playback time (not wall clock)

### Memory Management
- Release object URLs when videos unloaded
- Clear telemetry cache when loading new videos
- Monitor memory usage for long videos or many cameras

## Deployment Options

### Option 1: Local File
Open `index.html` directly in browser using `file://` protocol. No server needed.

**Pros**: Zero setup, complete privacy
**Cons**: Some browser features may be restricted in file:// mode

### Option 2: Local Development Server
Serve files via simple HTTP server for development.

**Pros**: Full browser API access, easier debugging
**Cons**: Requires command-line server

### Option 3: Static Hosting
Deploy to GitHub Pages, Netlify, Vercel, or any static host.

**Pros**: Shareable URL, no server maintenance, free hosting options
**Cons**: None for this use case

## Future Enhancements

### Phase 1 (MVP)
- Single camera playback with telemetry overlay
- Basic UI controls
- File loading and validation

### Phase 2
- Multi-camera synchronized playback
- Advanced telemetry visualization (gauges, graphs)
- Configurable layouts

### Phase 3
- Telemetry export (JSON/CSV)
- Event detection and markers (hard braking, etc.)
- GPS map visualization
- Video clip trimming/export

### Phase 4
- Comparison mode (two events side-by-side)
- Telemetry analysis (max speed, acceleration events)
- Route replay on map with synchronized video

## References

### Tesla Resources
- Tesla Dashcam GitHub: https://github.com/teslamotors/dashcam
- `dashcam.proto`: Protocol Buffer schema for SEI data
- `dashcam-mp4.js`: Reference MP4 parser implementation
- `sei_explorer.html`: Reference browser-based viewer

### Technical Standards
- ISO 14496-12: MP4 container format specification
- H.264/H.265: Video codec specifications with SEI support
- Protocol Buffers: Google's serialization format
- HTML5 File API: Browser file access specification
- HTML5 Video API: Video playback control specification
