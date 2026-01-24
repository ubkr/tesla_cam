# Technical Decisions

## Phase 1: Dependencies & Architecture

### MP4 Parsing Strategy
**Decision**: Use Tesla's `dashcam-mp4.js` library

**Rationale**:
- Proven compatibility with Tesla's video format
- Handles H.264 NAL unit parsing and emulation bytes correctly
- Already implements SEI extraction logic
- Well-tested on real Tesla dashcam footage
- Reduces development time and maintenance burden
- Less code to write and debug

**Alternative Considered**: Custom MP4 parser
- Rejected due to complexity and potential compatibility issues

### Protocol Buffers Library
**Decision**: Use `protobuf.js` v7.2.5

**Rationale**:
- Browser-compatible (no Node.js dependencies)
- Widely used and well-maintained
- Required by Tesla's `dashcam-mp4.js` library
- Supports loading `.proto` files dynamically

### Module Loading Strategy
**Decision**: ES6 modules with `type="module"`

**Rationale**:
- Native browser support (all modern browsers)
- Clean import/export syntax
- No build step or bundler required for MVP
- Easy to add bundler later if needed for optimization

**Implementation**:
- Use `<script type="module">` in HTML
- Use `import`/`export` statements in JS files
- Keep modules small and focused

### Overlay Rendering Approach
**Decision**: HTML/CSS overlay (not Canvas)

**Rationale**:
- Easier to style and maintain
- Accessible (screen readers can read text)
- Sufficient performance for real-time updates (10-30 Hz)
- Simpler implementation for MVP
- Can optimize with Canvas later if needed

**Alternative Considered**: Canvas rendering
- Deferred to Phase 2 if performance issues arise

### Background Processing
**Decision**: Use Web Worker for MP4 parsing

**Rationale**:
- Prevents UI freezing on large files (>100MB)
- Better user experience with progress indicators
- Modern browser support
- Worth the additional complexity (~50 lines of code)

### File Structure
```
tesla_cam/
├── index.html              # Main application shell
├── styles.css              # All styling
├── js/
│   ├── app.js             # Main application logic
│   ├── file-loader.js     # File selection & validation
│   ├── video-player.js    # Video playback controls
│   ├── mp4-parser.js      # Wrapper for dashcam-mp4.js
│   ├── mp4-worker.js      # Web Worker for parsing
│   ├── telemetry-decoder.js  # Protobuf decoding
│   ├── overlay-renderer.js   # Telemetry display
│   └── settings.js        # Settings panel & localStorage
├── lib/
│   ├── dashcam-mp4.js     # Tesla's MP4 parser
│   ├── dashcam.proto      # Protocol Buffer schema
│   └── protobuf.min.js    # Protobuf library
└── README.md              # User documentation
```

## Browser Compatibility

**Target Browsers**:
- Chrome/Edge 90+ (primary target)
- Firefox 88+
- Safari 14+

**Required Features**:
- ES6 modules
- File API (FileReader, Blob, URL.createObjectURL)
- HTML5 Video API
- Web Workers
- ArrayBuffer/DataView
- CSS Grid/Flexbox

**Known Issues**:
- H.265/HEVC codec support varies by browser
  - Safari/Firefox: Good support
  - Chrome: Limited (needs codec check and user warning)

## Performance Targets

- Video load time: < 5 seconds for typical 1-minute clips (~100MB)
- Parsing time: < 10 seconds for 1GB files (using Web Worker)
- Overlay update rate: 10-30 Hz (no visible lag)
- Memory usage: < 500MB for typical use case

## Privacy & Security

- All processing happens client-side in the browser
- Files never uploaded to any server
- No analytics or tracking
- Can run completely offline (file:// protocol or local server)
- Emphasize privacy in UI messaging

## Future Considerations

**Phase 2 (Multi-Camera Sync)**:
- Module architecture designed for easy extension
- Telemetry index can support multiple video streams
- UI layout can expand to grid view

**Phase 3 (Advanced Features)**:
- CSV export of telemetry data (already in dashcam-mp4.js)
- Playback speed controls (already in HTML5 video)
- Keyboard shortcuts
- Dark mode theme
- Canvas-based performance optimization

## Dependencies Summary

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| protobuf.js | 7.2.5 | Protocol Buffer decoding | CDN/local |
| dashcam-mp4.js | Latest | MP4 parsing & SEI extraction | Tesla GitHub |
| dashcam.proto | Latest | Telemetry data schema | Tesla GitHub |

## Implementation Timeline

- Phase 1 (Preparation): ✅ Complete
- Phase 2 (Foundation): Next
- Estimated total: 7-8 days to MVP
