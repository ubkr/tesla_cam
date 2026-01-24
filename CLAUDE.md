# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a pure JavaScript web application for analyzing and playing back video clips from Tesla dashcam footage. The application runs entirely in the browser with no server backend, ensuring user privacy as files never leave the local machine.

The primary goal is to provide synchronized playback of video with associated metadata including:
- Vehicle speed
- Direction indicators (turn signals)
- Autopilot/FSD status
- Steering angle, acceleration, braking
- GPS coordinates
- Other telemetry data from the vehicle

## Project Structure

This is a client-side web application that:
1. Allows users to load Tesla dashcam MP4 files via file picker or drag-and-drop
2. Parses MP4 files to extract embedded SEI metadata
3. Displays synchronized multi-camera video playback with telemetry overlay
4. Can be deployed as static files (HTML/CSS/JS) to any web host or used locally

## Tesla Dashcam Format

### File Structure
Tesla dashcam uses a `TeslaCam` folder with three subfolders:
- **RecentClips**: Up to 60 minutes of continuous recording (auto-overwrites)
- **SavedClips**: Manually saved clips (honk or dashcam icon saves last 10 minutes)
- **SentryClips**: Sentry Mode security event recordings

### Video Format
- **Container**: MP4 (H.264 or H.265/HEVC for HW3+)
- **Naming**: Timestamp-based (e.g., `2026-01-02_15-16-32-front.mp4`)
- **Cameras**: Up to 6 simultaneous recordings per event:
  - Front, Rear, Left, Right (4 cameras on older models)
  - Left B-Pillar, Right B-Pillar (6 cameras on newer models with HW3+)

### SEI Metadata (Telemetry Data)
**Requirements:**
- Firmware 2025.44.25 or later
- Hardware 3 (HW3) or newer
- Only recorded while driving (not in Sentry Mode or when parked)

**Data Format:**
- Embedded as SEI (Supplemental Enhancement Information) in the H.264/H.265 video stream
- Frame-synchronized with video (no separate timestamp matching needed)
- Defined via Protocol Buffers (see Tesla's dashcam.proto)

**Telemetry Fields:**
- Vehicle speed (m/s)
- Steering wheel angle
- Accelerator pedal position (0-1 scale)
- Brake status
- Turn signal activity (left/right indicators)
- Autopilot/FSD status (OFF, AUTOSTEER, FSD, TACC)
- GPS coordinates (longitude, latitude, direction)
- Linear acceleration (3-axis)
- Frame sequence numbers
- Gear selection (P/R/N/D)

### Official Tools
Tesla provides open-source tools at https://github.com/teslamotors/dashcam:
- `sei_explorer.html`: Browser-based player with metadata overlay
- `sei_extractor.py`: Python CLI tool for extracting SEI data
- `dashcam-mp4.js`: JavaScript library for MP4 parsing and SEI extraction
- `dashcam.proto`: Protocol Buffer schema defining the data structure

## Development

### Setup
This is a static web application requiring no build process or server setup for basic development:
```bash
# Option 1: Open index.html directly in browser (file:// protocol)
open index.html  # macOS
# start index.html  # Windows
# xdg-open index.html  # Linux

# Option 2: Use a local development server
npx serve .
# or
python -m http.server 8000
```

### Key Technologies
- **Vanilla JavaScript** (ES6+) for core logic
- **HTML5 File API** for local file access (no uploads)
- **HTML5 Video API** for synchronized multi-camera playback
- **MP4 parser** for extracting SEI metadata from video streams
- **Protocol Buffers** (protobuf.js) for deserializing SEI data
- **Canvas API** for telemetry overlay rendering
- **CSS Grid/Flexbox** for multi-camera layout

### Browser Compatibility
- Modern browsers with File API support (Chrome, Firefox, Safari, Edge)
- H.265/HEVC video codec support varies (Safari/Firefox better support than Chrome)
- For H.265 compatibility, may need to transcode or provide codec warnings

## Architecture Notes

- **Client-side only**: All processing happens in the browser using File API
- **No file uploads**: Files are read locally via FileReader API and never transmitted
- **SEI metadata**: Embedded in video streams, extracted by parsing MP4 box structure
- **Multi-camera sync**: Use filename timestamps to align multiple camera angles
- **Frame-level telemetry**: SEI data is frame-synchronized, matched via video playback time
- **Tesla's reference**: Can leverage open-source `dashcam-mp4.js` and `dashcam.proto` from Tesla
- **Deployment**: Static files can be hosted on GitHub Pages, Netlify, or opened locally
- **Performance**: Large video files handled via streaming/chunked reading, not full in-memory parsing
