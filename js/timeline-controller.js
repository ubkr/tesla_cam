/**
 * Timeline Controller Module
 * Manages video timeline with speed graph and event markers
 */

export class TimelineController {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.container = null;
        this.tooltip = null;
        this.videoPlayer = null;
        this.telemetryDecoder = null;

        // Timeline data
        this.speedData = [];
        this.events = [];
        this.duration = 0;
        this.currentTime = 0;

        // Canvas dimensions
        this.width = 0;
        this.height = 80;
        this.dpr = window.devicePixelRatio || 1;

        // Interaction state
        this.isHovering = false;
        this.hoverX = 0;
        this.isDragging = false;

        // Event type definitions
        this.EVENT_TYPES = {
            hardBraking: {
                threshold: -4.0,        // m/s² deceleration
                minSpeed: 5.0,          // mph
                color: '#dc3545',       // red
                icon: '🛑',
                label: 'Hard Braking'
            },
            brakeUsed: {
                minSpeed: 5.0,          // mph
                color: '#ff8c00',       // dark orange
                icon: '🔴',
                label: 'Brake Applied'
            },
            sharpTurn: {
                threshold: 180,         // degrees steering angle
                minSpeed: 10.0,         // mph
                color: '#ffc107',       // yellow
                icon: '↻',
                label: 'Sharp Turn'
            },
            autopilotChange: {
                detectTransition: true,
                color: '#0066cc',       // blue
                icons: { engage: '🤖', disengage: '✋' },
                labels: { engage: 'Autopilot Engaged', disengage: 'Autopilot Disengaged' }
            },
            rapidAcceleration: {
                threshold: 3.0,         // m/s² acceleration
                minSpeed: 5.0,          // mph
                color: '#28a745',       // green
                icon: '⚡',
                label: 'Rapid Acceleration'
            },
            speedThreshold: {
                threshold: 120,         // km/h
                color: '#ff6b6b',       // orange-red
                icon: '⚠',
                label: 'High Speed'
            }
        };

        // Throttle hover events
        this.lastHoverUpdate = 0;
        this.hoverThrottle = 16; // ~60fps

        // Bound handler for proper cleanup
        this._handleResizeBound = this.handleResize.bind(this);
    }

    /**
     * Initialize timeline with video player and telemetry
     */
    initialize(videoPlayer, telemetryDecoder, container) {
        if (!videoPlayer || !telemetryDecoder || !container) {
            console.error('Timeline: Missing required dependencies');
            return false;
        }

        this.videoPlayer = videoPlayer;
        this.telemetryDecoder = telemetryDecoder;
        this.container = container;
        this.duration = videoPlayer.duration;

        // Get canvas and tooltip elements
        this.canvas = container.querySelector('#timelineCanvas');
        this.tooltip = container.querySelector('#timelineTooltip');

        if (!this.canvas || !this.tooltip) {
            console.error('Timeline: Canvas or tooltip element not found');
            return false;
        }

        this.ctx = this.canvas.getContext('2d');

        // Show container
        this.container.classList.remove('hidden');

        // Setup canvas size
        this.setupCanvas();

        // Extract speed data
        this.extractSpeedData();

        // Detect events
        this.detectEvents();

        // Setup interaction
        this.setupInteraction();

        // Initial render
        this.render();

        // Handle window resize
        window.addEventListener('resize', this._handleResizeBound);

        return true;
    }

    /**
     * Setup canvas with proper dimensions and DPI scaling
     */
    setupCanvas() {
        // Get container width
        this.width = this.container.clientWidth;

        // Set display size (CSS pixels)
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        // Set actual size in memory (accounting for DPI)
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;

        // Scale context to match DPI
        this.ctx.scale(this.dpr, this.dpr);
    }

    /**
     * Extract speed data from telemetry
     */
    extractSpeedData() {
        if (!this.telemetryDecoder.hasTelemetry()) {
            console.warn('Timeline: No telemetry data available');
            return;
        }

        const allTelemetry = this.telemetryDecoder.getAllTelemetry();

        // Sample every 5th frame for performance
        const sampleRate = 5;
        this.speedData = [];

        for (let i = 0; i < allTelemetry.length; i += sampleRate) {
            const data = allTelemetry[i];
            this.speedData.push({
                timestamp: data.timestamp,
                speed: data.speed.mph
            });
        }

    }

    /**
     * Detect events from telemetry data
     */
    detectEvents() {
        if (!this.telemetryDecoder.hasTelemetry()) {
            return;
        }

        const allTelemetry = this.telemetryDecoder.getAllTelemetry();
        const events = [];
        let lastAutopilotState = null;
        let lastBrakeState = false;

        for (let i = 0; i < allTelemetry.length; i++) {
            const data = allTelemetry[i];

            // Hard braking: acceleration.x < -4.0 (longitudinal deceleration)
            if (data.acceleration.x < this.EVENT_TYPES.hardBraking.threshold &&
                data.speed.mph > this.EVENT_TYPES.hardBraking.minSpeed) {
                events.push({
                    type: 'hardBraking',
                    timestamp: data.timestamp,
                    severity: Math.abs(data.acceleration.x) / 10 // 0-1 scale
                });
            }

            // Brake pedal applied: detect transition from not pressed to pressed
            if (data.brake && !lastBrakeState &&
                data.speed.mph > this.EVENT_TYPES.brakeUsed.minSpeed) {
                events.push({
                    type: 'brakeUsed',
                    timestamp: data.timestamp,
                    severity: 0.7 // moderate severity
                });
            }
            lastBrakeState = data.brake;

            // Sharp turn: |steeringAngle| > 180
            if (Math.abs(data.steeringAngle) > this.EVENT_TYPES.sharpTurn.threshold &&
                data.speed.mph > this.EVENT_TYPES.sharpTurn.minSpeed) {
                events.push({
                    type: 'sharpTurn',
                    timestamp: data.timestamp,
                    severity: Math.abs(data.steeringAngle) / 360 // 0-1 scale
                });
            }

            // Autopilot state changes
            if (lastAutopilotState !== null &&
                lastAutopilotState !== data.autopilot.state) {
                const isEngaging = data.autopilot.state !== 0;
                events.push({
                    type: 'autopilotChange',
                    subtype: isEngaging ? 'engage' : 'disengage',
                    timestamp: data.timestamp,
                    severity: 1.0
                });
            }
            lastAutopilotState = data.autopilot.state;

            // Rapid acceleration: acceleration.x > 3.0 (longitudinal acceleration)
            if (data.acceleration.x > this.EVENT_TYPES.rapidAcceleration.threshold &&
                data.speed.mph > this.EVENT_TYPES.rapidAcceleration.minSpeed) {
                events.push({
                    type: 'rapidAcceleration',
                    timestamp: data.timestamp,
                    severity: data.acceleration.x / 10 // 0-1 scale
                });
            }

            // High speed: speed > 120 km/h
            if (data.speed.kph > this.EVENT_TYPES.speedThreshold.threshold) {
                // Only add every 30 frames to avoid too many markers
                if (i % 30 === 0) {
                    events.push({
                        type: 'speedThreshold',
                        timestamp: data.timestamp,
                        severity: Math.min(data.speed.kph / 160, 1.0)
                    });
                }
            }
        }

        // Deduplicate nearby events (within 0.5s)
        this.events = this.deduplicateEvents(events);

    }

    /**
     * Deduplicate events that are too close together
     */
    deduplicateEvents(events) {
        if (events.length === 0) return [];

        // Sort by timestamp
        events.sort((a, b) => a.timestamp - b.timestamp);

        const deduplicated = [];
        const minGap = 0.5; // seconds

        for (let i = 0; i < events.length; i++) {
            const event = events[i];

            // Check if too close to last event of same type
            const lastSameType = deduplicated
                .filter(e => e.type === event.type)
                .pop();

            if (!lastSameType ||
                (event.timestamp - lastSameType.timestamp) >= minGap) {
                deduplicated.push(event);
            }
        }

        return deduplicated;
    }

    /**
     * Setup interaction handlers
     */
    setupInteraction() {
        // Mouse move
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        // Mouse leave
        this.canvas.addEventListener('mouseleave', () => {
            this.isHovering = false;
            this.hideTooltip();
            this.render();
        });

        // Click to seek
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e);
        });

        // Mouse down for drag
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.handleClick(e);
        });

        // Mouse up
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(e) {
        const now = Date.now();
        if (now - this.lastHoverUpdate < this.hoverThrottle && !this.isDragging) {
            return;
        }
        this.lastHoverUpdate = now;

        const rect = this.canvas.getBoundingClientRect();
        this.hoverX = e.clientX - rect.left;
        this.isHovering = true;

        // Show tooltip
        const time = this.xToTime(this.hoverX);
        this.showTooltip(e.clientX, e.clientY, time);

        // Render with hover indicator
        this.render();

        // If dragging, seek video
        if (this.isDragging) {
            this.videoPlayer.seek(time);
        }
    }

    /**
     * Handle click
     */
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = this.xToTime(x);

        // Seek video
        this.videoPlayer.seek(time);
    }

    /**
     * Show tooltip with telemetry preview
     */
    showTooltip(x, y, time) {
        if (!this.telemetryDecoder.hasTelemetry()) {
            return;
        }

        const telemetry = this.telemetryDecoder.getTelemetryAtTime(time);
        if (!telemetry) {
            return;
        }

        // Format time
        const timeStr = this.formatTime(time);

        // Build tooltip content
        let html = `<div style="margin-bottom: 0.5rem; font-weight: bold;">${timeStr}</div>`;
        html += `<div>Speed: ${Math.round(telemetry.speed.mph)} mph</div>`;
        html += `<div>Steering: ${Math.round(telemetry.steeringAngle)}°</div>`;
        html += `<div>Autopilot: ${telemetry.autopilot.name}</div>`;

        // Check for events at this time
        const nearbyEvents = this.events.filter(e =>
            Math.abs(e.timestamp - time) < 1.0
        );

        if (nearbyEvents.length > 0) {
            html += `<div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.2);">`;
            html += `<div style="font-weight: bold; margin-bottom: 0.25rem;">Events:</div>`;
            nearbyEvents.forEach(event => {
                const eventType = this.EVENT_TYPES[event.type];
                if (eventType) {
                    const icon = event.subtype ? eventType.icons[event.subtype] : eventType.icon;
                    const label = event.subtype ? eventType.labels[event.subtype] : eventType.label;
                    html += `<div style="color: ${eventType.color};">${icon} ${label}</div>`;
                }
            });
            html += `</div>`;
        }

        this.tooltip.innerHTML = html;
        this.tooltip.classList.remove('hidden');

        // Position tooltip
        const tooltipWidth = 200;
        let tooltipX = x + 10;

        // Keep tooltip on screen
        if (tooltipX + tooltipWidth > window.innerWidth) {
            tooltipX = x - tooltipWidth - 10;
        }

        this.tooltip.style.left = `${tooltipX}px`;
        this.tooltip.style.top = `${y + 10}px`;
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        this.tooltip.classList.add('hidden');
    }

    /**
     * Render timeline
     */
    render() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw background
        this.drawBackground();

        // Draw speed graph
        this.drawSpeedGraph();

        // Draw event markers
        this.drawEventMarkers();

        // Draw progress indicator
        this.drawProgressIndicator();

        // Draw hover indicator
        if (this.isHovering) {
            this.drawHoverIndicator();
        }
    }

    /**
     * Draw background and grid
     */
    drawBackground() {
        // Background
        this.ctx.fillStyle = 'rgba(26, 26, 26, 0.95)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Time grid markers (every 10 seconds)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        const interval = 10; // seconds
        for (let t = 0; t < this.duration; t += interval) {
            const x = this.timeToX(t);
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
    }

    /**
     * Draw speed graph
     */
    drawSpeedGraph() {
        if (this.speedData.length === 0) return;

        // Find max speed for normalization
        const maxSpeed = Math.max(...this.speedData.map(d => d.speed), 1);

        // Draw filled area under curve
        this.ctx.fillStyle = 'rgba(0, 102, 204, 0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);

        for (let i = 0; i < this.speedData.length; i++) {
            const data = this.speedData[i];
            const x = this.timeToX(data.timestamp);
            const normalizedSpeed = data.speed / maxSpeed;
            const y = this.height - (normalizedSpeed * (this.height - 20));

            this.ctx.lineTo(x, y);
        }

        this.ctx.lineTo(this.width, this.height);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw line
        this.ctx.strokeStyle = 'rgba(0, 102, 204, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        for (let i = 0; i < this.speedData.length; i++) {
            const data = this.speedData[i];
            const x = this.timeToX(data.timestamp);
            const normalizedSpeed = data.speed / maxSpeed;
            const y = this.height - (normalizedSpeed * (this.height - 20));

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();
    }

    /**
     * Draw event markers
     */
    drawEventMarkers() {
        for (const event of this.events) {
            const x = this.timeToX(event.timestamp);
            const eventType = this.EVENT_TYPES[event.type];

            if (!eventType) continue;

            // Get color
            const color = eventType.color;

            // Draw vertical bar
            const barHeight = 10 + (event.severity * 30);
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x - 2, this.height - barHeight, 4, barHeight);

            // Draw icon at top
            if (event.type === 'autopilotChange' && event.subtype) {
                const icon = eventType.icons[event.subtype];
                this.drawIcon(icon, x, 10, color);
            } else if (eventType.icon) {
                this.drawIcon(eventType.icon, x, 10, color);
            }
        }
    }

    /**
     * Draw icon
     */
    drawIcon(icon, x, y, color) {
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw background circle
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw icon
        this.ctx.fillStyle = color;
        this.ctx.fillText(icon, x, y);
    }

    /**
     * Draw progress indicator
     */
    drawProgressIndicator() {
        const x = this.timeToX(this.currentTime);

        // Draw line
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.height);
        this.ctx.stroke();

        // Draw circle at top
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(x, 5, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Draw hover indicator
     */
    drawHoverIndicator() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.hoverX, 0);
        this.ctx.lineTo(this.hoverX, this.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    /**
     * Update video time (called from video player)
     */
    updateVideoTime(time) {
        this.currentTime = time;
        this.render();
    }

    /**
     * Convert time to X coordinate
     */
    timeToX(time) {
        return (time / this.duration) * this.width;
    }

    /**
     * Convert X coordinate to time
     */
    xToTime(x) {
        return Math.max(0, Math.min((x / this.width) * this.duration, this.duration));
    }

    /**
     * Format time as MM:SS
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${String(secs).padStart(2, '0')}`;
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.setupCanvas();
        this.render();
    }

    /**
     * Destroy timeline and cleanup
     */
    destroy() {
        if (this.container) {
            this.container.classList.add('hidden');
        }

        // Remove event listeners
        window.removeEventListener('resize', this._handleResizeBound);

        this.speedData = [];
        this.events = [];
        this.currentTime = 0;
    }
}
