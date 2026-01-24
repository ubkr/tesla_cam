# Testing Checklist

## Manual Testing - Tesla Dashcam Viewer MVP

### Test Environment
- **Browser**: Chrome, Firefox, Safari
- **Test File**: 2026-01-02_15-16-32-front.mp4 (37.4 MB)
- **Server**: http://localhost:8080

---

## 1. File Loading Tests

### 1.1 Drag and Drop
- [ ] Open application in browser
- [ ] Drag video file onto drop zone
- [ ] Drop zone highlights on hover
- [ ] File info displays (filename, size, camera, timestamp)
- [ ] Video begins loading
- [ ] Loading indicator appears

### 1.2 File Input
- [ ] Click "Choose File" button
- [ ] File picker opens
- [ ] Select video file
- [ ] File loads successfully

### 1.3 File Validation
- [ ] Try invalid file type (e.g., .txt, .jpg)
- [ ] Error message displays
- [ ] Try non-Tesla MP4 file
- [ ] Warning displays but video still loads

---

## 2. Video Playback Tests

### 2.1 Basic Playback
- [ ] Video loads and displays
- [ ] Video metadata shows (duration, resolution)
- [ ] Play/pause button works
- [ ] Seeking works (click on timeline)
- [ ] Volume control works
- [ ] Video plays smoothly without stuttering

### 2.2 Playback Controls
- [ ] Playback speed selector works (0.5x, 1x, 1.5x, 2x)
- [ ] Fullscreen mode works
- [ ] Video loops on end (or stops, check behavior)

---

## 3. Telemetry Parsing Tests

### 3.1 SEI Detection
- [ ] "Checking..." status appears during parsing
- [ ] Progress indicator shows parsing progress
- [ ] "Available (N frames)" status shows when complete
- [ ] No errors in console during parsing

### 3.2 Telemetry Index
- [ ] Telemetry data successfully extracted
- [ ] Console shows telemetry statistics
- [ ] Frame count matches expected range

---

## 4. Telemetry Overlay Tests

### 4.1 Overlay Visibility
- [ ] Overlay appears after telemetry parsing
- [ ] Overlay positioned correctly over video
- [ ] Overlay readable (good contrast)
- [ ] Overlay doesn't block important video content

### 4.2 Speed Display
- [ ] Speed value updates during playback
- [ ] Speed unit matches setting (mph/kph)
- [ ] Speed displays reasonable values (0-100+ mph)
- [ ] "--" displays when no data

### 4.3 Gear Indicator
- [ ] Gear displays (P, R, N, D)
- [ ] Gear changes during video (if applicable)

### 4.4 Turn Signals
- [ ] Left turn signal activates (highlights/blinks)
- [ ] Right turn signal activates
- [ ] Signals turn off when not active

### 4.5 Autopilot Status
- [ ] Autopilot status displays (OFF, FSD, AUTOSTEER, TACC)
- [ ] Badge color changes based on state
- [ ] Status updates during video

### 4.6 Steering Angle
- [ ] Steering angle displays in degrees
- [ ] Value updates during turns
- [ ] Shows positive/negative values correctly

### 4.7 Pedal Indicators
- [ ] Accelerator bar fills based on pedal position
- [ ] Percentage value updates
- [ ] Brake indicator shows Yes/No or bar
- [ ] Colors are correct (green for accel, red for brake)

### 4.8 Timestamp
- [ ] Current time displays in overlay
- [ ] Time format is MM:SS or HH:MM:SS
- [ ] Time updates smoothly

---

## 5. Settings Panel Tests

### 5.1 Panel Interaction
- [ ] Settings button opens panel
- [ ] Panel slides in from right
- [ ] Close button closes panel
- [ ] Panel doesn't block video unnecessarily

### 5.2 Speed Unit Toggle
- [ ] mph selected by default
- [ ] Switch to kph
- [ ] Speed value in overlay updates immediately
- [ ] Unit label updates
- [ ] Setting persists after page reload

### 5.3 Overlay Visibility Toggle
- [ ] Checkbox toggles overlay on/off
- [ ] Overlay disappears when unchecked
- [ ] Overlay reappears when checked
- [ ] Setting persists after page reload

### 5.4 Overlay Style
- [ ] "Detailed" style selected by default
- [ ] Switch to "Minimal"
- [ ] Overlay appearance changes
- [ ] Setting persists after page reload

---

## 6. Error Handling Tests

### 6.1 Video Without Telemetry
- [ ] Load video without SEI data
- [ ] Status shows "Not available (firmware...)"
- [ ] Video still plays
- [ ] Overlay doesn't appear
- [ ] No JavaScript errors

### 6.2 Invalid File
- [ ] Load non-MP4 file
- [ ] Error message displays
- [ ] Error is user-friendly
- [ ] Dismiss button works
- [ ] Can try another file after error

### 6.3 Corrupted File
- [ ] Load corrupted MP4
- [ ] Error message displays
- [ ] Application doesn't crash

### 6.4 Large File
- [ ] Load very large file (>1GB)
- [ ] Progress indicator shows
- [ ] Web Worker prevents UI blocking
- [ ] Warning shown if file is too large

---

## 7. Loading States Tests

### 7.1 Loading Indicator
- [ ] Shows when video is loading
- [ ] Shows when telemetry is parsing
- [ ] Progress bar updates (if applicable)
- [ ] Message text is clear
- [ ] Hides when loading complete

### 7.2 Progressive Display
- [ ] File info appears immediately
- [ ] Video section appears after load
- [ ] Overlay appears after parsing
- [ ] UI doesn't jump or reflow excessively

---

## 8. Responsive Design Tests

### 8.1 Desktop (1920x1080)
- [ ] Layout looks good
- [ ] Overlay readable
- [ ] All controls accessible
- [ ] No horizontal scroll

### 8.2 Tablet (768px)
- [ ] Layout adapts
- [ ] Video scales appropriately
- [ ] Overlay remains readable
- [ ] Settings panel works

### 8.3 Mobile (375px)
- [ ] Layout stacks correctly
- [ ] Video fits screen
- [ ] Overlay simplified/hidden if needed
- [ ] Settings panel full width
- [ ] Touch controls work

---

## 9. Browser Compatibility Tests

### 9.1 Chrome/Edge
- [ ] Video plays (H.264)
- [ ] All features work
- [ ] Console has no errors
- [ ] H.265 warning if applicable

### 9.2 Firefox
- [ ] Video plays (H.264/H.265)
- [ ] All features work
- [ ] Console has no errors

### 9.3 Safari
- [ ] Video plays (H.264/H.265)
- [ ] All features work
- [ ] Console has no errors

---

## 10. Performance Tests

### 10.1 Memory Usage
- [ ] Memory usage reasonable (<500MB for typical file)
- [ ] No memory leaks after multiple loads
- [ ] Object URLs properly revoked

### 10.2 Parsing Speed
- [ ] Parsing completes in reasonable time (<10s for 100MB file)
- [ ] UI remains responsive during parsing
- [ ] Progress updates smoothly

### 10.3 Overlay Update Rate
- [ ] Overlay updates smoothly (10-30 Hz)
- [ ] No visible lag or stuttering
- [ ] Video playback not affected by overlay

---

## 11. Privacy & Security Tests

### 11.1 Local Processing
- [ ] Network tab shows no file uploads
- [ ] All processing happens locally
- [ ] No external API calls (except CDN for libs)

### 11.2 Data Storage
- [ ] Only settings stored in localStorage
- [ ] No video data stored in localStorage
- [ ] No cookies set

---

## 12. Edge Cases

### 12.1 Empty/Missing Data
- [ ] Handle missing telemetry fields gracefully
- [ ] Display "--" or "N/A" for missing data
- [ ] No JavaScript errors

### 12.2 Rapid Actions
- [ ] Load multiple files in quick succession
- [ ] Toggle settings rapidly
- [ ] Seek video rapidly
- [ ] Application remains stable

### 12.3 Page Reload
- [ ] Settings persist after reload
- [ ] Can load new file after reload
- [ ] No stale state issues

---

## Test Results Summary

**Date**: _________________
**Tester**: _________________
**Browser**: _________________
**Pass Rate**: _____ / _____ (____%)

### Critical Issues
1.
2.
3.

### Minor Issues
1.
2.
3.

### Notes
