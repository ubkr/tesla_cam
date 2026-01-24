# Development TODO - Tesla Dashcam Viewer MVP

## Phase 1: MVP - Single Camera Playback with Telemetry Overlay

### 1. Project Foundation

#### 1.1 Basic Project Structure
- [ ] Create `index.html` with semantic HTML5 structure
- [ ] Create `styles.css` for base styling
- [ ] Create `js/` directory for JavaScript modules
- [ ] Set up basic responsive layout (mobile-friendly consideration)
- [ ] Add viewport meta tags and basic SEO

#### 1.2 Dependencies Setup
- [ ] Research and select Protocol Buffer library for browser (protobuf.js vs alternatives)
- [ ] Decide whether to use Tesla's `dashcam-mp4.js` or write custom parser
- [ ] Download Tesla's `dashcam.proto` file from GitHub repository
- [ ] Set up module loading strategy (ES6 modules, script tags, or bundler)
- [ ] Document dependency choices in README or CLAUDE.md

### 2. File Loading Component

#### 2.1 File Input Interface
- [ ] Create file input element (type="file" accept="video/mp4")
- [ ] Add drag-and-drop zone with visual feedback
- [ ] Style drop zone (border, hover states, active states)
- [ ] Handle drag events (dragover, dragleave, drop)
- [ ] Display selected filename in UI

#### 2.2 File Validation
- [ ] Validate file is MP4 format (check MIME type)
- [ ] Validate file size is reasonable (warn on very large files)
- [ ] Parse filename to extract timestamp (YYYY-MM-DD_HH-MM-SS-camera pattern)
- [ ] Validate filename matches expected Tesla format
- [ ] Display validation errors to user with helpful messages

#### 2.3 File Object Management
- [ ] Create object URL for selected video file
- [ ] Store file reference for MP4 parsing
- [ ] Handle file cleanup (revoke object URLs when done)
- [ ] Implement "load new video" functionality to clear previous state

### 3. Basic Video Playback

#### 3.1 Video Element Setup
- [ ] Create HTML5 video element with controls
- [ ] Set video source to object URL
- [ ] Configure video element attributes (preload, playsinline, etc.)
- [ ] Style video container (aspect ratio, centering, max-width)
- [ ] Add loading state indicator while video loads

#### 3.2 Playback Controls
- [ ] Implement play/pause button
- [ ] Create custom timeline scrubber
- [ ] Add current time display (MM:SS / MM:SS format)
- [ ] Implement volume control
- [ ] Add playback speed selector (0.5x, 1x, 1.5x, 2x)
- [ ] Style controls to match overall design

#### 3.3 Event Handling
- [ ] Listen to video 'loadedmetadata' event
- [ ] Listen to 'timeupdate' event for playback position
- [ ] Listen to 'play', 'pause', 'ended' events
- [ ] Handle errors (codec unsupported, file corrupted, etc.)
- [ ] Update UI state based on video events

### 4. MP4 Parsing & SEI Extraction

#### 4.1 MP4 Parser Setup
- [ ] Create `mp4-parser.js` module
- [ ] Implement MP4 box/atom structure parser
- [ ] Parse ftyp, moov, mdat boxes
- [ ] Locate video track (trak) information
- [ ] Navigate to sample data containing video frames

#### 4.2 SEI Data Extraction
- [ ] Identify H.264/H.265 NAL units in video stream
- [ ] Locate SEI NAL units (type 6 for H.264, type 39/40 for H.265)
- [ ] Extract SEI payload bytes
- [ ] Associate SEI data with frame numbers or timestamps
- [ ] Handle videos without SEI data (show appropriate message)

#### 4.3 Performance Optimization
- [ ] Implement chunked reading (avoid loading entire file into memory)
- [ ] Use Web Worker for parsing to avoid blocking UI
- [ ] Add progress indicator for parsing operation
- [ ] Cache parsed results to avoid re-parsing on seek
- [ ] Test with large video files (>1GB)

#### 4.4 Error Handling
- [ ] Detect and handle corrupted MP4 files
- [ ] Handle unsupported codec versions
- [ ] Provide fallback for videos without SEI data
- [ ] Show clear error messages to user

### 5. Protocol Buffer Decoding

#### 5.1 Protobuf Setup
- [ ] Load Tesla's `dashcam.proto` schema
- [ ] Initialize protobuf.js library
- [ ] Create message type definitions from proto file
- [ ] Test deserialization with sample SEI data

#### 5.2 SEI Data Deserialization
- [ ] Create `telemetry-decoder.js` module
- [ ] Deserialize raw SEI bytes into JavaScript objects
- [ ] Handle protobuf version field from SEI data
- [ ] Validate deserialized data structure
- [ ] Handle malformed or unexpected protobuf data

#### 5.3 Data Transformation
- [ ] Convert speed from m/s to mph and kph
- [ ] Normalize steering angle values
- [ ] Format accelerator/brake pedal positions (0-1 to percentage)
- [ ] Parse Autopilot status enum values
- [ ] Format GPS coordinates for display
- [ ] Convert timestamps/frame numbers to video time

#### 5.4 Telemetry Index
- [ ] Build efficient data structure mapping video time to telemetry
- [ ] Handle frame-to-time conversion
- [ ] Implement fast lookup for current playback time
- [ ] Handle gaps in telemetry data
- [ ] Cache telemetry index for quick seeking

### 6. Telemetry Overlay

#### 6.1 Overlay Container
- [ ] Create overlay container positioned over video
- [ ] Ensure overlay doesn't block video controls
- [ ] Make overlay responsive to video size changes
- [ ] Add toggle button to show/hide overlay
- [ ] Persist overlay visibility preference (localStorage)

#### 6.2 Telemetry Display Components
- [ ] Speed display (large, prominent, with unit mph/kph)
- [ ] Gear indicator (P/R/N/D badge)
- [ ] Turn signal indicators (left/right arrows with active states)
- [ ] Autopilot status badge (OFF/AUTOSTEER/FSD/TACC)
- [ ] Steering wheel angle visualization (wheel icon or degree value)
- [ ] Brake/accelerator bars or gauges
- [ ] GPS coordinates (lat/long, optional)
- [ ] Timestamp display

#### 6.3 Real-time Updates
- [ ] Query telemetry index on video timeupdate
- [ ] Update all displayed values
- [ ] Animate transitions for smooth updates
- [ ] Handle missing telemetry gracefully (show "N/A" or hide)
- [ ] Optimize update frequency (throttle if needed)

#### 6.4 Styling
- [ ] Design clean, readable overlay UI
- [ ] Use appropriate fonts (monospace for numbers)
- [ ] Add semi-transparent background for readability
- [ ] Use color coding (red for brake, green for accelerator, etc.)
- [ ] Ensure visibility on various video backgrounds
- [ ] Add icons/symbols for intuitive understanding

### 7. User Interface & Experience

#### 7.1 Application Shell
- [ ] Create header with app title and description
- [ ] Add instructions for first-time users
- [ ] Create main content area for video and controls
- [ ] Add footer with credits and links
- [ ] Implement responsive layout (mobile, tablet, desktop)

#### 7.2 Settings Panel
- [ ] Create settings panel (modal or sidebar)
- [ ] Add speed unit selector (mph/kph toggle)
- [ ] Add overlay style options (minimal/detailed)
- [ ] Add theme selector (light/dark mode - optional)
- [ ] Save settings to localStorage
- [ ] Apply settings immediately

#### 7.3 Loading States
- [ ] Show spinner when loading video
- [ ] Show progress bar when parsing MP4
- [ ] Show "Processing telemetry data..." message
- [ ] Disable controls until video ready
- [ ] Show percentage complete for long operations

#### 7.4 Error States
- [ ] Design error message component
- [ ] Show specific error messages for different failures
- [ ] Provide actionable suggestions (e.g., "Try converting video")
- [ ] Add "Try another file" button
- [ ] Log errors to console for debugging

#### 7.5 Success States
- [ ] Show confirmation when video loaded successfully
- [ ] Display video metadata (duration, resolution, camera angle)
- [ ] Show telemetry availability status
- [ ] Provide visual feedback for user actions

### 8. Testing & Validation

#### 8.1 Sample Video Testing
- [ ] Test with provided sample video (2026-01-02_15-16-32-front.mp4)
- [ ] Verify video plays correctly
- [ ] Confirm SEI data extraction works
- [ ] Validate telemetry display is accurate
- [ ] Test all UI controls

#### 8.2 Edge Cases
- [ ] Test with video without SEI data (older firmware)
- [ ] Test with H.265/HEVC encoded video
- [ ] Test with very large files (>2GB)
- [ ] Test with corrupted or invalid MP4 files
- [ ] Test with non-Tesla dashcam videos

#### 8.3 Browser Compatibility
- [ ] Test in Chrome/Chromium
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Document any browser-specific issues

#### 8.4 Performance Testing
- [ ] Measure parsing time for typical videos
- [ ] Check memory usage during playback
- [ ] Verify smooth overlay updates (no stuttering)
- [ ] Test seeking performance
- [ ] Profile with browser dev tools

### 9. Documentation

#### 9.1 User Documentation
- [ ] Create README.md with usage instructions
- [ ] Add screenshot or demo GIF
- [ ] Document browser requirements
- [ ] Explain Tesla video compatibility (firmware version, HW3+)
- [ ] Add troubleshooting section

#### 9.2 Developer Documentation
- [ ] Document code architecture in comments
- [ ] Add JSDoc comments for public functions
- [ ] Update CLAUDE.md with implementation details
- [ ] Document any deviations from ARCHITECTURE.md
- [ ] Create CONTRIBUTING.md if open-sourcing

#### 9.3 Technical Notes
- [ ] Document Tesla's SEI format specifics discovered
- [ ] Note any quirks or gotchas encountered
- [ ] List known limitations
- [ ] Document future enhancement ideas

### 10. Polish & Deployment

#### 10.1 Code Quality
- [ ] Review and refactor code for clarity
- [ ] Remove console.log statements or add proper logging
- [ ] Add error boundaries/handlers
- [ ] Ensure consistent code style
- [ ] Add comments for complex logic

#### 10.2 Accessibility
- [ ] Add ARIA labels to interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Test with screen reader (basic check)
- [ ] Add alt text for icons
- [ ] Ensure sufficient color contrast

#### 10.3 Performance Optimization
- [ ] Minify CSS and JavaScript (if not using bundler)
- [ ] Optimize asset loading
- [ ] Implement lazy loading where appropriate
- [ ] Test and optimize for mobile devices

#### 10.4 Deployment
- [ ] Test opening index.html locally (file:// protocol)
- [ ] Test with local HTTP server
- [ ] Deploy to GitHub Pages or similar
- [ ] Verify all functionality works when deployed
- [ ] Update documentation with live demo link

## Success Criteria for MVP

- [ ] User can load a single Tesla dashcam MP4 file
- [ ] Video plays smoothly with standard controls
- [ ] Telemetry overlay displays synchronized data during playback
- [ ] All telemetry fields render correctly (speed, turn signals, etc.)
- [ ] Application works in major browsers (Chrome, Firefox, Safari)
- [ ] Clear error messages for unsupported videos
- [ ] Basic documentation exists (README with usage instructions)
- [ ] Code is organized and maintainable for future enhancements

## Notes

- Prioritize getting basic playback working before perfecting overlay design
- Use Tesla's sample video for initial development and testing
- Focus on Chrome/Firefox first, Safari compatibility can be secondary
- Keep code modular to facilitate Phase 2 (multi-camera) development
- Consider using Tesla's official libraries where possible to reduce reinvention
