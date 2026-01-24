/**
 * Main Application Logic
 * Initializes and coordinates all modules
 */

import { FileLoader } from './file-loader.js';
import { VideoPlayer } from './video-player.js';
import { MP4Parser } from './mp4-parser.js';
import { TelemetryDecoder } from './telemetry-decoder.js';
import { Settings } from './settings.js';

class TeslaDashcamApp {
    constructor() {
        this.fileLoader = null;
        this.videoPlayer = null;
        this.mp4Parser = null;
        this.telemetryDecoder = null;
        this.settings = null;
        this.currentFile = null;
        this.telemetryData = null;

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
        console.log('Initializing Tesla Dashcam Viewer...');

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

            console.log('Application initialized successfully');
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
            console.log('Video loaded:', data);
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
                this.updateTelemetryOverlay(data.currentTime);
            } else {
                console.log('DEBUG: Telemetry not available yet', {
                    hasDecoder: !!this.telemetryDecoder,
                    hasTelemetry: this.telemetryDecoder ? this.telemetryDecoder.hasTelemetry() : false
                });
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
        // Check for errors
        if (fileData.error) {
            this.showError('File Error', fileData.error);
            return;
        }

        console.log('File selected:', fileData);
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

        this.showLoading('Parsing telemetry data...');

        try {
            const result = await this.mp4Parser.parseFile(this.currentFile.file, {
                useWorker: true,
                onProgress: (progress) => {
                    this.showLoading(`${progress.message} (${progress.percentage}%)`);
                    this.updateProgressBar(progress.percentage);
                }
            });

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

                    // Show telemetry overlay
                    this.showTelemetryOverlay();

                    // Log statistics
                    const stats = this.telemetryDecoder.getStatistics();
                    console.log('Telemetry statistics:', stats);
                } else {
                    statusEl.textContent = 'Not available (firmware 2025.44.25+ required)';
                    statusEl.style.color = 'var(--warning-color)';
                    console.warn('No telemetry data found in video');
                }
            }
        } catch (error) {
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
     * Show telemetry overlay
     */
    showTelemetryOverlay() {
        const overlay = document.getElementById('telemetryOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            console.log('Telemetry overlay enabled');
            console.log('DEBUG: Overlay element:', overlay);
            console.log('DEBUG: Overlay classes:', overlay.className);
            console.log('DEBUG: Overlay computed display:', window.getComputedStyle(overlay).display);
        } else {
            console.error('DEBUG: Overlay element not found!');
        }
    }

    /**
     * Update telemetry overlay with current data
     */
    updateTelemetryOverlay(currentTime) {
        const telemetry = this.telemetryDecoder.getTelemetryAtTime(currentTime);

        console.log('DEBUG updateTelemetryOverlay:', { currentTime, telemetry: !!telemetry });

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
            const oldValue = speedValue.textContent;
            const formattedSpeed = TelemetryDecoder.formatSpeed(telemetry.speed, speedUnit);
            speedValue.textContent = formattedSpeed;
            speedUnitEl.textContent = speedUnit;
            if (Math.random() < 0.1) { // Log 10% of updates to avoid spam
                console.log('DEBUG: Speed DOM update:', {
                    oldValue,
                    newValue: formattedSpeed,
                    elementExists: !!speedValue,
                    isVisible: window.getComputedStyle(speedValue).display !== 'none'
                });
            }
        } else {
            console.error('DEBUG: Speed elements not found!', { speedValue, speedUnitEl });
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
            acceleratorBar.style.width = `${accelPercent}%`;
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

        // Update GPS (if visible)
        const gpsValue = document.getElementById('gpsValue');
        if (gpsValue) {
            gpsValue.textContent = TelemetryDecoder.formatGPS(telemetry.gps);
        }

        console.log('DEBUG: Overlay updated with values:', {
            speed: TelemetryDecoder.formatSpeed(telemetry.speed, speedUnit),
            gear: telemetry.gear.name,
            autopilot: telemetry.autopilot.name
        });
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
