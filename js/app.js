/**
 * Main Application Logic
 * Initializes and coordinates all modules
 */

import { FileLoader } from './file-loader.js';
import { VideoPlayer } from './video-player.js';
import { MP4Parser } from './mp4-parser.js';
import { TelemetryDecoder } from './telemetry-decoder.js';
import { Settings } from './settings.js';
import { MapController } from './map-controller.js';
import { TimelineController } from './timeline-controller.js';

class TeslaDashcamApp {
    constructor() {
        this.fileLoader = null;
        this.videoPlayer = null;
        this.mp4Parser = null;
        this.telemetryDecoder = null;
        this.settings = null;
        this.mapController = null;
        this.timelineController = null;
        this.currentFile = null;
        this.telemetryData = null;
        this._parseGeneration = 0;

        // UI Elements
        this.elements = {
            fileLoadSection: document.getElementById('fileLoadSection'),
            videoSection: document.getElementById('videoSection'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            loadingMessage: document.getElementById('loadingMessage'),
            errorContainer: document.getElementById('errorContainer'),
            errorTitle: document.getElementById('errorTitle'),
            errorMessage: document.getElementById('errorMessage'),
            dismissErrorBtn: document.getElementById('dismissErrorBtn'),
            fileInfo: document.getElementById('fileInfo'),
            videoMetadata: document.getElementById('videoMetadata'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsPanel: document.getElementById('settingsPanel'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn')
        };
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            // Initialize file loader
            this.fileLoader = new FileLoader();
            this.fileLoader.initialize('fileInput', 'dropZone');
            this.fileLoader.onFileSelected(this.handleFileSelected.bind(this));

            // Initialize video player
            this.videoPlayer = new VideoPlayer('videoPlayer');
            this.setupVideoPlayerCallbacks();

            // Initialize MP4 parser
            this.mp4Parser = new MP4Parser();

            // Initialize telemetry decoder
            this.telemetryDecoder = new TelemetryDecoder();

            // Initialize settings
            this.settings = new Settings();
            this.settings.initialize();

            // Setup UI event listeners
            this.setupUIEventListeners();

        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Initialization Error', error.message);
        }
    }

    /**
     * Setup video player callbacks
     */
    setupVideoPlayerCallbacks() {
        this.videoPlayer.onLoadedMetadata((data) => {
            this.updateVideoMetadata(data);
        });

        this.videoPlayer.onTimeUpdate((data) => {
            // Update timestamp in overlay
            const timestamp = VideoPlayer.formatTime(data.currentTime);
            const timestampEl = document.getElementById('overlayTimestamp');
            if (timestampEl) {
                timestampEl.textContent = timestamp;
            }

            // Update telemetry overlay if available
            if (this.telemetryDecoder && this.telemetryDecoder.hasTelemetry()) {
                const telemetry = this.telemetryDecoder.getTelemetryAtTime(data.currentTime);

                this.updateTelemetryOverlay(data.currentTime);

                // Update map position
                if (this.mapController && telemetry && telemetry.gps.isValid) {
                    this.mapController.updatePosition(
                        telemetry.gps.latitude,
                        telemetry.gps.longitude,
                        telemetry.gps.heading
                    );
                }

                // Update timeline progress
                if (this.timelineController) {
                    this.timelineController.updateVideoTime(data.currentTime);
                }
            }
        });

        this.videoPlayer.onError((error) => {
            this.hideLoading();
            this.showError('Video Error', error.message);
        });
    }

    /**
     * Setup UI event listeners
     */
    setupUIEventListeners() {
        // Settings button
        this.elements.settingsBtn.addEventListener('click', () => {
            this.toggleSettings();
        });

        this.elements.closeSettingsBtn.addEventListener('click', () => {
            this.toggleSettings();
        });

        // Toggle dashboard button
        const toggleOverlayBtn = document.getElementById('toggleOverlayBtn');
        if (toggleOverlayBtn) {
            toggleOverlayBtn.addEventListener('click', () => {
                this.toggleTelemetryDashboardVisibility();
            });
        }

        // Dismiss error button
        this.elements.dismissErrorBtn.addEventListener('click', () => {
            this.hideError();
        });

        // Close error on background click
        this.elements.errorContainer.addEventListener('click', (e) => {
            if (e.target === this.elements.errorContainer) {
                this.hideError();
            }
        });
    }

    /**
     * Handle file selection
     */
    async handleFileSelected(fileData) {
        // Cancel any in-progress parse
        this._parseGeneration++;
        this.mp4Parser.cancel();

        // Check for errors
        if (fileData.error) {
            this.showError('File Error', fileData.error);
            return;
        }

        this.currentFile = fileData;

        // Display file info
        this.displayFileInfo(fileData);

        // Show loading indicator
        this.showLoading('Loading video...');

        try {
            // Load video
            await this.videoPlayer.loadVideo(fileData.objectURL);

            // Show video section
            this.showVideoSection();

            // Parse MP4 for telemetry data
            await this.parseTelemetryData();

        } catch (error) {
            this.hideLoading();
            this.hideProgressBar();
            this.showError('Video Loading Error', error.message);
        }
    }

    /**
     * Parse telemetry data from MP4 file
     */
    async parseTelemetryData() {
        if (!this.currentFile || !this.currentFile.file) {
            return;
        }

        const generation = this._parseGeneration;

        this.showLoading('Parsing telemetry data...');

        try {
            const result = await this.mp4Parser.parseFile(this.currentFile.file, {
                useWorker: true,
                onProgress: (progress) => {
                    if (this._parseGeneration !== generation) return;
                    this.showLoading(`${progress.message} (${progress.percentage}%)`);
                    this.updateProgressBar(progress.percentage);
                }
            });

            // Discard stale results if a newer file was selected during parsing
            if (this._parseGeneration !== generation) return;

            this.hideLoading();
            this.hideProgressBar();

            // Store telemetry data
            this.telemetryData = result;

            // Update telemetry status
            const statusEl = document.getElementById('telemetryStatus');
            if (statusEl) {
                if (result.hasTelemetry) {
                    // Build telemetry index
                    const indexSize = this.telemetryDecoder.buildIndex(
                        result.seiMessages,
                        result.config,
                        this.videoPlayer.duration
                    );

                    statusEl.textContent = `Available (${indexSize} frames)`;
                    statusEl.style.color = 'var(--success-color)';

                    // Show telemetry dashboard
                    this.showTelemetryDashboard();

                    // Initialize map with GPS data
                    this.initializeMap();

                    // Initialize timeline
                    const timelineContainer = document.getElementById('customTimeline');
                    if (timelineContainer) {
                        this.timelineController = new TimelineController();
                        const initialized = this.timelineController.initialize(
                            this.videoPlayer,
                            this.telemetryDecoder,
                            timelineContainer
                        );

                        if (!initialized) {
                            console.error('Failed to initialize timeline');
                        } else {
                            // Apply saved visibility preference
                            this.settings.applyTimelineVisibility();
                        }
                    }

                } else {
                    statusEl.textContent = 'Not available (firmware 2025.44.25+ required)';
                    statusEl.style.color = 'var(--warning-color)';
                    console.warn('No telemetry data found in video');
                }
            }
        } catch (error) {
            if (this._parseGeneration !== generation) return;

            this.hideLoading();
            this.hideProgressBar();

            console.error('Telemetry parsing error:', error);

            // Update telemetry status
            const statusEl = document.getElementById('telemetryStatus');
            if (statusEl) {
                statusEl.textContent = 'Error';
                statusEl.style.color = 'var(--danger-color)';
            }

            // Show warning (not error, video still playable)
            console.warn('Failed to parse telemetry data:', error.message);
        }
    }

    /**
     * Display file information
     */
    displayFileInfo(fileData) {
        const { filename, isTeslaFormat, camera, timestamp, size } = fileData;

        let html = `<strong>File:</strong> ${filename}<br>`;
        html += `<strong>Size:</strong> ${this.fileLoader.formatFileSize(size)}<br>`;

        if (isTeslaFormat) {
            html += `<strong>Camera:</strong> ${camera}<br>`;
            html += `<strong>Recorded:</strong> ${timestamp.toLocaleString()}<br>`;
        } else {
            html += `<em>Note: Filename doesn't match Tesla dashcam format</em><br>`;
        }

        this.elements.fileInfo.innerHTML = html;
        this.elements.fileInfo.classList.remove('hidden');
    }

    /**
     * Update video metadata display
     */
    updateVideoMetadata(data) {
        const { duration, width, height } = data;

        let html = '<div style="display: flex; gap: 2rem; flex-wrap: wrap;">';
        html += `<div><strong>Duration:</strong> ${VideoPlayer.formatTime(duration)}</div>`;
        html += `<div><strong>Resolution:</strong> ${width} × ${height}</div>`;
        html += `<div><strong>Telemetry:</strong> <span id="telemetryStatus">Checking...</span></div>`;
        html += '</div>';

        this.elements.videoMetadata.innerHTML = html;
    }

    /**
     * Show video section
     */
    showVideoSection() {
        this.elements.fileLoadSection.classList.add('hidden');
        this.elements.videoSection.classList.remove('hidden');
    }

    /**
     * Show telemetry dashboard
     */
    showTelemetryDashboard() {
        const dashboard = document.getElementById('telemetryDashboard');
        if (dashboard) {
            dashboard.classList.remove('hidden');

            // Apply saved visibility preference (whether to show/hide the data grid)
            this.settings.applyDashboardVisibility();
        }
    }

    /**
     * Toggle telemetry dashboard visibility (hide/show the data grid)
     */
    toggleTelemetryDashboardVisibility() {
        // Get current visibility state
        const currentlyVisible = this.settings.get('overlayVisible');

        // Toggle it via settings (which will handle DOM updates and icon changes)
        this.settings.setOverlayVisible(!currentlyVisible);
    }

    /**
     * Update telemetry overlay with current data
     */
    updateTelemetryOverlay(currentTime) {
        const telemetry = this.telemetryDecoder.getTelemetryAtTime(currentTime);

        if (!telemetry) {
            console.warn('No telemetry data found for time:', currentTime);
            return;
        }

        // Get speed unit from settings
        const speedUnit = this.settings.get('speedUnit');

        // Update speed display
        const speedValue = document.getElementById('speedValue');
        const speedUnitEl = document.getElementById('speedUnit');
        if (speedValue && speedUnitEl) {
            speedValue.textContent = TelemetryDecoder.formatSpeed(telemetry.speed, speedUnit);
            speedUnitEl.textContent = speedUnit;
        }

        // Update gear
        const gearValue = document.getElementById('gearValue');
        if (gearValue) {
            gearValue.textContent = telemetry.gear.name;
        }

        // Update turn signals
        const leftSignal = document.getElementById('leftSignal');
        const rightSignal = document.getElementById('rightSignal');
        if (leftSignal) {
            leftSignal.classList.toggle('active', telemetry.turnSignals.left);
        }
        if (rightSignal) {
            rightSignal.classList.toggle('active', telemetry.turnSignals.right);
        }

        // Update autopilot status
        const autopilotValue = document.getElementById('autopilotValue');
        if (autopilotValue) {
            autopilotValue.textContent = telemetry.autopilot.name;
            autopilotValue.classList.toggle('autopilot-active',
                telemetry.autopilot.state === 2 || telemetry.autopilot.state === 3);
            autopilotValue.classList.toggle('fsd-active', telemetry.autopilot.state === 1);
        }

        // Update steering angle
        const steeringValue = document.getElementById('steeringValue');
        if (steeringValue) {
            steeringValue.textContent = TelemetryDecoder.formatSteeringAngle(telemetry.steeringAngle);
        }

        // Update accelerator
        const acceleratorBar = document.getElementById('acceleratorBar');
        const acceleratorValue = document.getElementById('acceleratorValue');
        if (acceleratorBar && acceleratorValue) {
            const accelPercent = Math.round(telemetry.accelerator);
            // Clamp bar width to 0-100% for visual display
            const barWidth = Math.min(Math.max(accelPercent, 0), 100);
            acceleratorBar.style.width = `${barWidth}%`;
            acceleratorValue.textContent = `${accelPercent}%`;
        }

        // Update brake
        const brakeBar = document.getElementById('brakeBar');
        const brakeValue = document.getElementById('brakeValue');
        if (brakeBar && brakeValue) {
            const brakePercent = telemetry.brake ? 100 : 0;
            brakeBar.style.width = `${brakePercent}%`;
            brakeValue.textContent = telemetry.brake ? 'Yes' : 'No';
        }

        // Update regenerative braking
        const regenBar = document.getElementById('regenBar');
        const regenValue = document.getElementById('regenValue');
        if (regenBar && regenValue) {
            const regenPercent = telemetry.regenBraking ? 100 : 0;
            regenBar.style.width = `${regenPercent}%`;
            regenValue.textContent = telemetry.regenBraking ? 'Yes' : 'No';
        }

        // Update GPS (if visible)
        const gpsValue = document.getElementById('gpsValue');
        if (gpsValue) {
            gpsValue.textContent = TelemetryDecoder.formatGPS(telemetry.gps);
        }

        // Update acceleration vector indicator
        this.updateAccelerationIndicator(telemetry.acceleration);
    }

    /**
     * Update acceleration vector visualization
     */
    updateAccelerationIndicator(acceleration) {
        const canvas = document.getElementById('accelCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = centerX - 10; // Leave margin for border

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw center crosshairs
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - 5, centerY);
        ctx.lineTo(centerX + 5, centerY);
        ctx.moveTo(centerX, centerY - 5);
        ctx.lineTo(centerX, centerY + 5);
        ctx.stroke();

        // Draw reference circles (for scale)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        [0.33, 0.66].forEach(scale => {
            ctx.beginPath();
            ctx.arc(centerX, centerY, maxRadius * scale, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Get acceleration values
        // X = forward/backward (positive = forward acceleration, negative = braking)
        // Y = left/right (positive = right, negative = left)
        // Z = vertical (positive = up, negative = down)
        const accelX = acceleration.x || 0;
        const accelY = acceleration.y || 0;
        const accelZ = acceleration.z || 0;

        // Calculate total 3D acceleration magnitude (for G-force display)
        const accelMagnitude = Math.sqrt(accelX * accelX + accelY * accelY + accelZ * accelZ);

        // Calculate horizontal plane magnitude (for visual arrow direction/length)
        const accelHorizontal = Math.sqrt(accelX * accelX + accelY * accelY);

        // Scale factor: Tesla Model Y can exceed 1g during hard braking and Performance acceleration
        // Use 1.5g (15 m/s²) as full scale to prevent clipping during hard maneuvers
        const scaleFactor = maxRadius / 15; // 15 m/s² (~1.5g) = full radius

        // Calculate vector endpoint (using horizontal components only for 2D display)
        // Note: Canvas Y-axis is inverted (down is positive), so negate accelX
        const vectorX = centerX + (accelY * scaleFactor);
        const vectorY = centerY - (accelX * scaleFactor); // Negate for correct direction

        // Clamp to circle boundary
        const dx = vectorX - centerX;
        const dy = vectorY - centerY;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        let endX = vectorX;
        let endY = vectorY;

        if (magnitude > maxRadius) {
            const angle = Math.atan2(dy, dx);
            endX = centerX + Math.cos(angle) * maxRadius;
            endY = centerY + Math.sin(angle) * maxRadius;
        }

        // Color based on total 3D magnitude (green -> yellow -> red)
        // Using total magnitude ensures color represents true G-force intensity
        let vectorColor;
        if (accelMagnitude < 2) {
            vectorColor = '#00ff00'; // Green (light: < 0.2g)
        } else if (accelMagnitude < 5) {
            vectorColor = '#ffff00'; // Yellow (moderate: 0.2-0.5g)
        } else {
            vectorColor = '#ff0000'; // Red (strong: > 0.5g)
        }

        // Draw the vector line
        ctx.strokeStyle = vectorColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw arrowhead (only for significant horizontal forces)
        if (accelHorizontal > 3) { // Show arrow when horizontal acceleration > 3 m/s² (~0.3g)
            const angle = Math.atan2(endY - centerY, endX - centerX);
            const arrowLength = 8;
            const arrowAngle = Math.PI / 6;

            ctx.fillStyle = vectorColor;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - arrowLength * Math.cos(angle - arrowAngle),
                endY - arrowLength * Math.sin(angle - arrowAngle)
            );
            ctx.lineTo(
                endX - arrowLength * Math.cos(angle + arrowAngle),
                endY - arrowLength * Math.sin(angle + arrowAngle)
            );
            ctx.closePath();
            ctx.fill();
        }

        // Draw center dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Update G-force text value (1g = 9.8 m/s²)
        const gForce = accelMagnitude / 9.8;
        const accelValueEl = document.getElementById('accelValue');
        if (accelValueEl) {
            accelValueEl.textContent = `${gForce.toFixed(2)}g`;
        }
    }

    /**
     * Initialize map with GPS data
     */
    initializeMap() {
        if (!this.telemetryDecoder || !this.telemetryDecoder.hasTelemetry()) {
            console.warn('No telemetry data available for map');
            return;
        }

        // Get all telemetry data
        const allTelemetry = this.telemetryDecoder.getAllTelemetry();

        // Find first valid GPS coordinate
        const firstValid = allTelemetry.find(t => t.gps && t.gps.isValid);

        if (!firstValid) {
            console.warn('No valid GPS data found in telemetry');
            // Hide map container
            const mapContainer = document.getElementById('mapContainer');
            if (mapContainer) {
                mapContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 0.9rem; text-align: center; padding: 2rem;">GPS data not available in this video</div>';
            }
            return;
        }

        // Initialize map controller
        this.mapController = new MapController('mapContainer');
        const initialized = this.mapController.initialize(
            firstValid.gps.latitude,
            firstValid.gps.longitude
        );

        if (!initialized) {
            console.error('Failed to initialize map');
            return;
        }

        // Build route from all telemetry
        this.mapController.buildRouteFromTelemetry(allTelemetry);

    }

    /**
     * Show loading indicator
     */
    showLoading(message = 'Loading...') {
        this.elements.loadingMessage.textContent = message;
        this.elements.loadingIndicator.classList.remove('hidden');
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.elements.loadingIndicator.classList.add('hidden');
    }

    /**
     * Update progress bar
     */
    updateProgressBar(percentage) {
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');

        if (progressBar && progressFill) {
            progressBar.classList.remove('hidden');
            progressFill.style.width = `${percentage}%`;
        }
    }

    /**
     * Hide progress bar
     */
    hideProgressBar() {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.classList.add('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(title, message) {
        this.elements.errorTitle.textContent = title;
        this.elements.errorMessage.textContent = message;
        this.elements.errorContainer.classList.remove('hidden');
    }

    /**
     * Hide error message
     */
    hideError() {
        this.elements.errorContainer.classList.add('hidden');
    }

    /**
     * Toggle settings panel
     */
    toggleSettings() {
        // Remove 'hidden' class and toggle 'visible' class
        this.elements.settingsPanel.classList.remove('hidden');
        this.elements.settingsPanel.classList.toggle('visible');
    }

    /**
     * Reset application to initial state
     */
    reset() {
        this.hideError();
        this.hideLoading();
        this.videoPlayer.reset();
        this.fileLoader.reset();
        this.currentFile = null;
        this.telemetryData = null;

        // Clean up map
        if (this.mapController) {
            this.mapController.destroy();
            this.mapController = null;
        }

        // Clean up timeline
        if (this.timelineController) {
            this.timelineController.destroy();
            this.timelineController = null;
        }

        this.elements.videoSection.classList.add('hidden');
        this.elements.fileLoadSection.classList.remove('hidden');
        this.elements.fileInfo.classList.add('hidden');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new TeslaDashcamApp();
    app.initialize();

    // Make app globally accessible for debugging
    window.teslaDashcamApp = app;
});
