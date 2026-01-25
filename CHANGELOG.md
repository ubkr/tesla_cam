# Changelog

All notable changes to the Tesla Dashcam Viewer project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-25

### Added
- **GPS Map Integration** - Interactive map showing vehicle route and position
  - Leaflet.js integration with OpenStreetMap tiles
  - Real-time position marker synchronized with video playback
  - Complete route path displayed as blue polyline
  - Auto-zoom to fit entire route
  - Responsive layout (side-by-side on desktop, stacked on mobile)
  - Graceful handling of videos without GPS data
- **ROADMAP.md** - Comprehensive roadmap consolidating all future enhancements
  - Organized by priority (High, Medium, Low)
  - Includes complexity estimates and target versions
  - Detailed feature descriptions and benefits
- **GPS_MAP_FEATURE.md** - Quick reference guide for GPS map feature
- **CHANGELOG.md** - This file for tracking version history

### Changed
- Updated responsive layout to accommodate map view
- Modified video container to use CSS Grid layout
- Enhanced documentation with map feature details
- README.md now references consolidated ROADMAP.md
- IMPLEMENTATION_SUMMARY.md updated to v1.1.0

### Technical Details
- Added `js/map-controller.js` module (137 lines)
- Integrated Leaflet.js v1.9.4 via CDN
- Modified `js/app.js` for map lifecycle management
- Updated `styles.css` with grid layout and responsive breakpoints
- Modified `index.html` with map container and Leaflet CDN links

### Files Changed
- New: `js/map-controller.js`, `GPS_MAP_FEATURE.md`, `ROADMAP.md`, `CHANGELOG.md`
- Modified: `index.html`, `styles.css`, `js/app.js`, `README.md`, `IMPLEMENTATION_SUMMARY.md`

---

## [1.0.0] - 2026-01-24

### Added
- **Initial MVP Release** - Browser-based Tesla dashcam viewer
- Video playback with HTML5 video controls
- SEI metadata extraction from MP4 files
- Protocol Buffer deserialization of telemetry data
- Real-time telemetry overlay synchronized with video
  - Vehicle speed (mph/kph)
  - Gear position (P/R/N/D)
  - Turn signals (animated)
  - Autopilot/FSD status
  - Steering wheel angle
  - Accelerator and brake indicators
  - GPS coordinates (text display)
  - Timestamp
- Settings panel
  - Speed unit toggle (mph/kph)
  - Overlay visibility toggle
  - Overlay style selector (detailed/minimal)
- File loading with drag-and-drop support
- Tesla filename parsing and validation
- Responsive design (desktop, tablet, mobile)
- Privacy-first architecture (all processing client-side)
- Comprehensive error handling
- Loading indicators with progress bars

### Technical Implementation
- Pure JavaScript with ES6 modules
- Web Worker for MP4 parsing (prevents UI blocking)
- Protocol Buffers integration (protobuf.js)
- Tesla's official dashcam-mp4.js library
- Modular architecture for maintainability

### Documentation
- README.md with usage instructions
- ARCHITECTURE.md with system design
- DECISIONS.md with technical choices
- TESTING.md with comprehensive test checklist
- IMPLEMENTATION_SUMMARY.md tracking development
- CLAUDE.md with project instructions

### Dependencies
- protobuf.js v7.2.5
- Tesla's dashcam-mp4.js
- Tesla's dashcam.proto schema

---

## [Unreleased]

See [ROADMAP.md](ROADMAP.md) for planned future enhancements.

### Planned for v1.2.0
- Multi-camera synchronization
- Telemetry data export (CSV/JSON)

### Planned for v1.3.0
- Video timeline with event markers
- Enhanced map features (satellite view, speed heatmap)
- Keyboard shortcuts

### Planned for v1.4.0
- Dark mode theme
- Event detection (hard braking, sharp turns)
- Custom overlay layouts

---

## Version Numbering

This project uses [Semantic Versioning](https://semver.org/):
- **Major** (X.0.0): Breaking changes or major new features
- **Minor** (1.X.0): New features, backward compatible
- **Patch** (1.1.X): Bug fixes, backward compatible

---

**Maintained By**: Project contributors
**Last Updated**: January 25, 2026
