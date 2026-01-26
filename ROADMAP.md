# Tesla Dashcam Viewer - Roadmap

This document consolidates all planned future enhancements for the Tesla Dashcam Viewer. Features are organized by priority and category.

---

## Current Version

**Version**: 1.2.0 (Timeline & Event Markers)
**Date**: January 26, 2026

### Completed Features ✅

**Phase 1 - MVP (v1.0.0):**
- Single camera video playback
- SEI metadata extraction and protobuf decoding
- Real-time telemetry overlay (speed, gear, turn signals, autopilot, steering, pedals)
- Settings panel (speed units, overlay visibility, overlay style)
- Responsive design (desktop, tablet, mobile)
- Privacy-first architecture (all processing client-side)

**Phase 2 - GPS Integration (v1.1.0):**
- Interactive GPS map with OpenStreetMap tiles
- Complete route visualization
- Real-time position tracking synchronized with video
- Responsive map layout (side-by-side on desktop, stacked on mobile)

**Phase 3 - Timeline & Events (v1.2.0):**
- Interactive video timeline with speed graph visualization
- 6 event types with color-coded markers (hard braking, brake usage, sharp turns, autopilot changes, rapid acceleration, high speed)
- Click/drag to seek and scrub through video
- Hover tooltips showing telemetry data
- Settings integration for timeline visibility
- Mobile-responsive design with performance optimizations

---

## Planned Enhancements

### High Priority (Next Release - v1.3.0)

#### 1. Reposition Telemetry Overlay
**Status**: Planned
**Complexity**: Low
**Description**: Move telemetry dashboard from video overlay to dedicated panel
- Remove telemetry overlay from covering the video
- Position dashboard to the right, above the GPS map
- Maintain responsive layout (stack vertically on mobile)
- Keep same telemetry data and styling
- Ensure dashboard remains synchronized with video playback

**Layout Changes**:
```
Desktop:                      Mobile:
┌──────────┬────────┐        ┌──────────┐
│          │Teleme- │        │  Video   │
│  Video   │  try   │        ├──────────┤
│          │Dashboard│       │Dashboard │
│          ├────────┤        ├──────────┤
│          │  Map   │        │   Map    │
├──────────┴────────┤        ├──────────┤
│     Timeline      │        │ Timeline │
└───────────────────┘        └──────────┘
```

**Benefits**:
- Unobstructed video viewing
- Better use of screen real estate
- Clearer dashboard visibility
- More professional layout

---

#### 2. Multi-Camera Synchronization
**Status**: Planned
**Complexity**: High
**Description**: Simultaneously play all 4-6 camera angles from a single event
- Parse and load multiple video files from same timestamp
- Synchronize playback across all cameras
- Grid layout with selectable primary view
- Shared telemetry overlay (same data across all views)
- Handle missing camera files gracefully

**Technical Considerations**:
- Video sync using shared currentTime
- Layout: 2x2 or 3x2 grid depending on camera count
- Memory management for multiple video buffers
- UI for selecting which cameras to load

**Benefits**:
- Complete 360° view of driving event
- Better context for incidents
- Professional-grade playback experience

---

#### 3. Telemetry Data Export
**Status**: Planned
**Complexity**: Medium
**Description**: Export telemetry data to standard formats
- CSV export with all telemetry fields
- JSON export for programmatic use
- Time-stamped data aligned with video timeline
- Include GPS coordinates, speed, autopilot status, etc.
- Option to export entire session or time range

**Export Format Examples**:
```csv
timestamp,speed_mph,gear,autopilot,latitude,longitude,heading
0.000,0,P,OFF,37.773972,-122.431297,45.0
0.033,0,P,OFF,37.773972,-122.431297,45.0
```

**Benefits**:
- Data analysis in spreadsheets or Python
- Integration with other tools
- Route analysis and statistics

---

### Medium Priority (v1.4.0 - v1.5.0)

#### 4. Enhanced Map Features
**Status**: Partially implemented (basic map in v1.1.0)
**Complexity**: Medium
**Description**: Advanced map functionality
- Satellite/terrain view toggle
- Custom car icon that rotates with heading
- Speed markers along route path
- Speed heatmap (color-coded by speed)
- Distance markers and total distance calculation
- Popup showing speed/time when clicking route
- Auto-pan option (map follows current position)
- Route statistics panel (max speed, avg speed, total distance)

**Map Enhancements**:
- Different tile providers (satellite, hybrid, terrain)
- Custom car icon (Tesla logo or car silhouette)
- Speed-based route coloring (green=slow, yellow=medium, red=fast)
- Click anywhere on route to jump video to that time

---

#### 5. Keyboard Shortcuts
**Status**: Planned
**Complexity**: Low
**Description**: Keyboard controls for faster interaction
- `Space`: Play/Pause
- `←/→`: Skip backward/forward 5 seconds
- `↑/↓`: Volume up/down
- `F`: Toggle fullscreen
- `M`: Mute/unmute
- `T`: Toggle telemetry overlay
- `G`: Toggle GPS map
- `0-9`: Jump to 0%-90% of video
- `[/]`: Slow down/speed up playback
- `?`: Show keyboard shortcut help

**Implementation**:
- Add keyboard event listeners
- Show on-screen help overlay (press `?`)
- Don't interfere with native video controls

---

#### 6. Dark Mode Theme
**Status**: Planned
**Complexity**: Low
**Description**: Dark theme for comfortable viewing
- Toggle between light/dark themes
- Dark theme with OLED-friendly blacks
- Automatic detection from OS preferences
- Persist theme preference in localStorage
- Smooth theme transitions

**Design**:
- Dark gray background (#1a1a1a)
- Lighter text (#e0e0e0)
- Adjust overlay transparency for visibility
- Ensure map tiles work well in dark mode

---

#### 7. Event Detection
**Status**: Planned
**Complexity**: Medium
**Description**: Automatic detection of driving events
- Hard braking (sudden deceleration)
- Sharp turns (high steering angle + speed)
- Autopilot engagement/disengagement
- Speed threshold violations (configurable)
- Rapid acceleration
- Near-miss detection (from acceleration data)

**Features**:
- Timeline markers for detected events
- Event list sidebar with thumbnails
- Click to jump to event
- Export event log
- Configurable thresholds

---

### Low Priority (Future Versions)

#### 8. Custom Overlay Layouts
**Status**: Planned
**Complexity**: Medium
**Description**: User-customizable telemetry overlay
- Drag-and-drop overlay elements
- Show/hide individual telemetry fields
- Resize and reposition elements
- Save custom layouts
- Preset layouts (minimal, racing, detailed)

---

#### 9. Video Clip Creation
**Status**: Planned
**Complexity**: High
**Description**: Create and export video clips
- Select time range to export
- Burn telemetry overlay into video
- Multiple quality/resolution options
- Include selected cameras in multi-cam mode
- Progress indicator for export

**Technical Challenges**:
- Client-side video encoding (ffmpeg.wasm)
- Large memory requirements
- Slow processing time
- Browser compatibility

---

#### 10. Performance Improvements
**Status**: Ongoing
**Complexity**: Variable
**Description**: Optimize for better performance
- Virtual scrolling for long telemetry lists
- Progressive loading for very large files
- IndexedDB caching of parsed telemetry
- Service worker for offline capability
- Reduce memory footprint
- Faster MP4 parsing algorithms

---

#### 11. Advanced Statistics
**Status**: Planned
**Complexity**: Medium
**Description**: Comprehensive drive analytics
- Distance traveled calculation
- Time in each autopilot mode
- Speed distribution histogram
- Acceleration/braking statistics
- Route elevation profile (if available)
- Average speed by road type

**Dashboard Examples**:
- Max speed: 65 mph
- Average speed: 42 mph
- Total distance: 12.3 miles
- Autopilot usage: 73%
- Hard braking events: 2
- Sharp turns: 8

---

#### 12. Share & Collaboration
**Status**: Planned
**Complexity**: High
**Description**: Share clips and collaborate
- Generate shareable links with timestamp
- Annotate videos with comments/markers
- Share specific events or time ranges
- Privacy controls (redact GPS, speed, etc.)
- Embed player in other websites

**Privacy Considerations**:
- GPS coordinates optional
- Speed/telemetry optional
- Must be opt-in for privacy reasons

---

#### 13. Browser Extension
**Status**: Idea phase
**Complexity**: High
**Description**: Chrome/Firefox extension for quick access
- Open Tesla videos directly from file browser
- Context menu integration
- Mini player in side panel
- Quick telemetry preview

---

## Not Planned (Out of Scope)

The following features are intentionally NOT planned to keep the project focused:

- ❌ Server-side processing (privacy violation)
- ❌ Video upload/cloud storage (privacy violation)
- ❌ Social features (comments, likes, sharing without privacy)
- ❌ Mobile app (web-first approach)
- ❌ Video editing (outside scope)
- ❌ Live streaming integration
- ❌ Authentication/user accounts

---

## Technical Debt & Maintenance

### Code Quality Improvements
- Add automated testing (Jest, Playwright)
- Set up CI/CD pipeline
- Add linting and code formatting (ESLint, Prettier)
- Improve error handling and user feedback
- Add comprehensive JSDoc comments
- Refactor large functions into smaller modules

### Documentation
- Create video tutorials
- Add interactive demo with sample video
- Expand troubleshooting guide
- Document Tesla firmware compatibility matrix
- Create developer contribution guide

### Browser Compatibility
- Improve H.265/HEVC codec handling
- Add fallback for older browsers
- Test and optimize for Safari
- Progressive enhancement approach

---

## Community Requests

Track feature requests from users:
- [ ] Batch processing multiple videos
- [ ] Compare two drives side-by-side
- [ ] Integration with Tesla API for additional data
- [ ] OBD-II data overlay (for non-Tesla vehicles)
- [ ] Support for other dashcam formats (BlackVue, etc.)

---

## Release Schedule (Tentative)

**v1.2.0** (Q1 2026): ✅ COMPLETED
- Video timeline with event markers
- 6 event types with interactive features

**v1.3.0** (Q1 2026):
- Reposition telemetry overlay
- Multi-camera synchronization
- Telemetry data export (CSV/JSON)

**v1.4.0** (Q2 2026):
- Enhanced map features
- Keyboard shortcuts

**v1.5.0** (Q3 2026):
- Dark mode theme
- Custom overlay layouts

**v2.0.0** (Q4 2026):
- Major UI redesign
- Advanced statistics dashboard
- Performance overhaul

---

## Contributing

Want to help implement these features? See CONTRIBUTING.md (to be created) for:
- Development setup
- Code style guidelines
- Pull request process
- Feature proposal process

---

## Feedback

Have ideas for new features? Please:
1. Check if it's already listed in this roadmap
2. Check GitHub issues for existing discussions
3. Open a new issue with the "enhancement" label
4. Provide use cases and mockups if possible

---

**Document Version**: 1.1
**Last Updated**: January 26, 2026
**Maintained By**: Project contributors

---

## Version History

- **v1.2.0** (Jan 2026): Video timeline with event markers ✅
- **v1.1.0** (Jan 2026): GPS map integration ✅
- **v1.0.0** (Jan 2026): MVP release with single camera playback and telemetry overlay ✅
