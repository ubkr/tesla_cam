# Tesla Dashcam Viewer

A browser-based viewer for Tesla dashcam footage with synchronized telemetry overlay. View your Tesla dashcam videos with real-time display of speed, Autopilot status, steering angle, and other vehicle data.

## Features

- **Video Playback**: Play Tesla dashcam MP4 files directly in your browser
- **Telemetry Overlay**: Real-time display of vehicle data synchronized with video
  - Vehicle speed (mph/kph)
  - Gear position (P/R/N/D)
  - Turn signals
  - Autopilot/FSD status
  - Steering wheel angle
  - Accelerator pedal position
  - Brake status
  - GPS coordinates
- **Privacy First**: All processing happens locally in your browser - files never leave your computer
- **No Installation**: Works directly in modern web browsers, no software to install
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Requirements

### Tesla Vehicle Requirements

To have telemetry data embedded in videos:
- **Firmware**: 2025.44.25 or later
- **Hardware**: HW3 (Hardware 3.0) or newer
- **Recording Mode**: Telemetry is only recorded while driving (not in Sentry Mode or when parked)

### Browser Requirements

Modern browser with HTML5 video support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Note**: H.265/HEVC codec support varies by browser. Safari and Firefox generally have better H.265 support than Chrome. If you encounter playback issues, try converting your videos to H.264 codec.

## Usage

### Option 1: Local File Access

1. Download this repository or copy the files to your computer
2. Open `index.html` in your web browser
3. Drag and drop a Tesla dashcam MP4 file onto the page, or click "Choose File"
4. The video will load and play with telemetry overlay (if available)

### Option 2: Local Web Server

For better performance and to avoid CORS issues:

```bash
# Using Python (Python 3)
python -m http.server 8000

# Or using npx
npx serve .

# Or using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Deploy to Web Hosting

You can deploy this application to any static web hosting service:
- GitHub Pages
- Netlify
- Vercel
- Amazon S3
- Your own web server

Simply upload all files and access via your domain.

## Tesla Dashcam File Format

Tesla dashcam videos follow this naming convention:
```
YYYY-MM-DD_HH-MM-SS-<camera>.mp4
```

Example:
```
2026-01-02_15-16-32-front.mp4
```

Camera positions:
- `front` - Front-facing camera
- `rear` - Rear-facing camera
- `left_repeater` - Left side camera
- `right_repeater` - Right side camera
- `left_pillar` - Left B-pillar camera (HW3+ only)
- `right_pillar` - Right B-pillar camera (HW3+ only)

### Folder Structure

Tesla creates a `TeslaCam` folder on your USB drive with three subfolders:
- **RecentClips**: Continuous recording (up to 60 minutes, auto-overwrites)
- **SavedClips**: Manually saved clips (honk or tap dashcam icon)
- **SentryClips**: Sentry Mode security events

## Settings

Click the gear icon in the header to access settings:

- **Speed Unit**: Toggle between miles per hour (mph) and kilometers per hour (kph)
- **Show Telemetry Overlay**: Toggle overlay visibility on/off
- **Overlay Style**: Choose between detailed or minimal display

Settings are automatically saved to your browser's localStorage and persist across sessions.

## Troubleshooting

### "No telemetry data" message

**Possible causes:**
1. Video was recorded with older firmware (before 2025.44.25)
2. Video was recorded in Sentry Mode or while parked
3. Vehicle has older hardware (pre-HW3)
4. File is not from a Tesla vehicle

**Solution**: The video will still play, but telemetry overlay won't be available. This is normal for older recordings.

### Video won't play

**Possible causes:**
1. Browser doesn't support H.265/HEVC codec (common in Chrome)
2. File is corrupted
3. File is not a valid MP4 video

**Solutions:**
- Try a different browser (Safari or Firefox have better H.265 support)
- Convert video to H.264 codec using ffmpeg or HandBrake
- Verify the file is a valid Tesla dashcam recording

### Video plays but overlay doesn't update

**Possible causes:**
1. Telemetry parsing failed
2. JavaScript errors in console

**Solutions:**
- Check browser console (F12) for errors
- Refresh the page and try again
- Report issue if problem persists

### Performance issues with large files

**Possible causes:**
1. File is very large (>1GB)
2. Browser running out of memory
3. Slow computer

**Solutions:**
- Close other browser tabs
- Try smaller video clips
- Use a more powerful computer

## Privacy & Security

This application is designed with privacy in mind:

- **No uploads**: Files are processed entirely in your browser
- **No server**: All processing happens client-side using JavaScript
- **No tracking**: No analytics or data collection
- **Offline capable**: Works without internet connection once loaded
- **Open source**: All code is visible and auditable

Your dashcam footage never leaves your computer.

## Technical Details

### Architecture

- **Pure JavaScript**: No build process or frameworks required
- **ES6 Modules**: Modern, modular code organization
- **Web Workers**: Background processing for large files
- **Protocol Buffers**: Efficient binary data decoding
- **HTML5 Video API**: Native video playback

### Data Processing

1. **File Loading**: Uses File API to read MP4 files locally
2. **MP4 Parsing**: Extracts SEI (Supplemental Enhancement Information) metadata
3. **Protobuf Decoding**: Deserializes binary telemetry data
4. **Telemetry Indexing**: Creates time-based index for fast lookup
5. **Overlay Rendering**: Updates DOM elements synchronized with video playback

### Dependencies

- **protobuf.js** (v7.2.5): Protocol Buffer library for JavaScript
- **dashcam-mp4.js**: Tesla's official MP4 parser (from [teslamotors/dashcam](https://github.com/teslamotors/dashcam))
- **dashcam.proto**: Protocol Buffer schema defining telemetry structure

## Credits

- Tesla for providing [open-source dashcam tools](https://github.com/teslamotors/dashcam)
- Protocol Buffers by Google
- protobuf.js library

## License

This project is provided as-is for educational and personal use. Tesla dashcam format and tools are © Tesla, Inc.

## Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

## Roadmap

Future enhancements planned:
- Multi-camera synchronization (play all 4-6 cameras simultaneously)
- Telemetry data export (CSV, JSON)
- Video timeline with speed/event markers
- Keyboard shortcuts for playback control
- Dark mode theme
- Route visualization on map
- Event detection (hard braking, sharp turns)

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section above
- Review Tesla's [official dashcam documentation](https://github.com/teslamotors/dashcam)
- Open an issue on GitHub (if repository is public)

## Version

**Version**: 1.0.0 (MVP)
**Last Updated**: January 2026
