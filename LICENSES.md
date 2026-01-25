# Third-Party Licenses

This document lists all third-party code and libraries used in the Tesla Dashcam Viewer project.

---

## Copied/Included Code

### 1. Tesla Dashcam Tools
**Source**: https://github.com/teslamotors/dashcam  
**Files Copied**:
- `lib/dashcam-mp4.js` - MP4 parser for extracting SEI metadata
- `lib/dashcam.proto` - Protocol Buffer schema for telemetry data
- `lib/sei_explorer_reference.html` - Reference implementation

**License**: Not explicitly stated in repository  
**Copyright**: © Tesla, Inc.  
**Usage**: Used as reference and integrated for MP4 parsing functionality

**Note**: Tesla's repository does not include a LICENSE file. These files are provided by Tesla as open-source tools but without explicit license terms. Use is assumed to be permitted for educational and personal use based on their public availability.

---

### 2. protobuf.js
**Source**: https://github.com/protobufjs/protobuf.js  
**File**: `lib/protobuf.min.js` (v7.2.5)

**License**: BSD-3-Clause License  
**Copyright**: © 2016 Daniel Wirtz

**License Summary**: Permissive license allowing redistribution in source or binary form with conditions:
- Retain copyright notice and disclaimers
- Don't use names for endorsement without permission

**Full License**: https://github.com/protobufjs/protobuf.js/blob/master/LICENSE

---

## External Dependencies (CDN)

### 3. Leaflet.js
**Source**: https://github.com/Leaflet/Leaflet  
**Version**: 1.9.4 (loaded via CDN)  
**CDN**: https://unpkg.com/leaflet@1.9.4/dist/leaflet.js

**License**: BSD-2-Clause License  
**Copyright**: © 2010-2023 Volodymyr Agafonkin, © 2010-2011 CloudMade

**License Summary**: Permissive license allowing redistribution in source or binary form with conditions:
- Retain copyright notice and disclaimers

**Full License**: https://github.com/Leaflet/Leaflet/blob/main/LICENSE

**Tile Provider (OpenStreetMap)**: Map tiles © OpenStreetMap contributors, licensed under ODbL  
**Tile Usage**: https://www.openstreetmap.org/copyright

---

## Original Code

All other code in this project is original work created for the Tesla Dashcam Viewer:

**Original Modules**:
- `js/app.js` - Main application logic
- `js/file-loader.js` - File loading and validation
- `js/video-player.js` - Video playback controls
- `js/mp4-parser.js` - MP4 parser wrapper
- `js/mp4-worker.js` - Web Worker for parsing
- `js/telemetry-decoder.js` - Telemetry decoding and indexing
- `js/settings.js` - Settings management
- `js/map-controller.js` - GPS map integration
- `index.html` - Application UI
- `styles.css` - Styling

**License**: Not yet specified (project does not have LICENSE file)  
**Recommendation**: Add MIT License or BSD-2-Clause for consistency with dependencies

---

## License Compatibility

All third-party licenses (BSD-2-Clause, BSD-3-Clause) are:
- ✅ Permissive and compatible with each other
- ✅ Allow commercial use
- ✅ Allow modification and redistribution
- ✅ Require attribution (copyright notices must be retained)

---

## Attribution Requirements

When redistributing or deploying this project, ensure:

1. **Copyright notices retained** in all source files
2. **License texts included** for protobuf.js and Leaflet.js
3. **OpenStreetMap attribution** displayed on map (handled by Leaflet.js)
4. **Tesla acknowledgment** for dashcam tools and proto schema

---

## Recommendations

1. **Add LICENSE file** to this project (suggest MIT or BSD-2-Clause)
2. **Clarify Tesla usage** - Contact Tesla or assume fair use for educational purposes
3. **Update README** with attribution section
4. **Include licenses** in distribution packages

---

**Document Version**: 1.0  
**Last Updated**: January 25, 2026
