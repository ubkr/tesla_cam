/**
 * Telemetry Decoder Module
 * Decodes SEI data, converts units, and builds indexed telemetry data
 */

// Unit conversion constants
const MPS_TO_MPH = 2.23694;
const MPS_TO_KPH = 3.6;

// Autopilot state names
const AUTOPILOT_STATES = {
    0: 'OFF',
    1: 'FSD',
    2: 'AUTOSTEER',
    3: 'TACC'
};

// Gear state names
const GEAR_STATES = {
    0: 'P',
    1: 'D',
    2: 'R',
    3: 'N'
};

export class TelemetryDecoder {
    constructor() {
        this.telemetryIndex = new Map();
        this.frameRate = 30; // Default frame rate
        this.duration = 0;
    }

    /**
     * Build telemetry index from SEI messages and video config
     */
    buildIndex(seiMessages, videoConfig, duration) {
        console.log('Building telemetry index...', {
            messageCount: seiMessages.length,
            videoConfig,
            duration
        });

        this.duration = duration;
        this.telemetryIndex.clear();

        // Calculate frame rate from video config
        if (videoConfig && videoConfig.durations && videoConfig.durations.length > 0) {
            const avgFrameDuration = videoConfig.durations.reduce((a, b) => a + b, 0) / videoConfig.durations.length;
            this.frameRate = avgFrameDuration > 0 ? 1000 / avgFrameDuration : 30;
        }

        // Process each SEI message
        for (let i = 0; i < seiMessages.length; i++) {
            const seiData = seiMessages[i];

            // Decode and convert units
            const telemetry = this.decodeSEIMessage(seiData, i);

            // Calculate video timestamp from array index
            // NOTE: frameSeqNo is a cumulative counter from the entire recording session,
            // not the frame number within this specific video clip.
            // We must use the array index (i) to get timestamps that align with video playback.
            const timestamp = i / this.frameRate;

            // Add to index
            this.telemetryIndex.set(timestamp, telemetry);
        }

        console.log(`Telemetry index built: ${this.telemetryIndex.size} entries`);
        return this.telemetryIndex.size;
    }

    /**
     * Decode single SEI message and convert units
     */
    decodeSEIMessage(seiData, index) {
        // NOTE: Protobuf decoder returns camelCase field names (frameSeqNo, vehicleSpeedMps, etc.)
        // NOT snake_case (frame_seq_no, vehicle_speed_mps)

        // Convert speed from m/s to mph and kph
        const speedMps = seiData.vehicleSpeedMps || 0;
        const speedMph = speedMps * MPS_TO_MPH;
        const speedKph = speedMps * MPS_TO_KPH;

        // Get steering angle
        const steeringAngle = seiData.steeringWheelAngle || 0;

        // Get pedal positions (raw value - scale varies, clamp to 0-100 for display)
        const acceleratorRaw = seiData.acceleratorPedalPosition || 0;
        // Tesla documentation says 0-1, but real data shows 0-100 scale
        // Clamp to prevent display issues
        const accelerator = Math.min(Math.max(acceleratorRaw, 0), 100);

        // Get brake status
        const brakeApplied = seiData.brakeApplied || false;

        // Get turn signals
        const leftSignal = seiData.blinkerOnLeft || false;
        const rightSignal = seiData.blinkerOnRight || false;

        // Get autopilot state
        const autopilotState = seiData.autopilotState || 0;
        const autopilotName = AUTOPILOT_STATES[autopilotState] || 'OFF';

        // Get gear state
        const gearState = seiData.gearState || 0;
        const gearName = GEAR_STATES[gearState] || 'P';

        // Get GPS coordinates
        const latitude = seiData.latitudeDeg || null;
        const longitude = seiData.longitudeDeg || null;
        const heading = seiData.headingDeg || null;

        // Get linear acceleration
        const accelX = seiData.linearAccelerationMps2X || 0;
        const accelY = seiData.linearAccelerationMps2Y || 0;
        const accelZ = seiData.linearAccelerationMps2Z || 0;

        // Get frame sequence number
        const frameSeqNo = seiData.frameSeqNo || index;

        // Detect regenerative braking (engine braking)
        // Occurs when: decelerating, accelerator lifted, brake not applied, vehicle moving
        const isRegenerativeBraking = (
            accelX < -0.5 &&              // Decelerating (negative acceleration)
            accelerator < 5 &&             // Accelerator pedal lifted (< 5%)
            !brakeApplied &&               // Physical brake not pressed
            speedMps > 0.5                 // Vehicle is moving (> 0.5 m/s)
        );

        return {
            // Speed (multiple units for convenience)
            speed: {
                mps: speedMps,
                mph: speedMph,
                kph: speedKph
            },

            // Steering
            steeringAngle,

            // Pedals
            accelerator,
            brake: brakeApplied,
            regenBraking: isRegenerativeBraking,

            // Turn signals
            turnSignals: {
                left: leftSignal,
                right: rightSignal
            },

            // Autopilot
            autopilot: {
                state: autopilotState,
                name: autopilotName,
                isActive: autopilotState !== 0
            },

            // Gear
            gear: {
                state: gearState,
                name: gearName
            },

            // GPS
            gps: {
                latitude,
                longitude,
                heading,
                isValid: latitude !== null && longitude !== null
            },

            // Acceleration
            acceleration: {
                x: accelX,
                y: accelY,
                z: accelZ
            },

            // Frame info
            frameSeqNo,

            // Raw data (for debugging)
            _raw: seiData
        };
    }

    /**
     * Get telemetry data for a specific video time
     */
    getTelemetryAtTime(time) {
        // Find closest timestamp
        let closestTime = null;
        let minDiff = Infinity;

        for (const timestamp of this.telemetryIndex.keys()) {
            const diff = Math.abs(timestamp - time);
            if (diff < minDiff) {
                minDiff = diff;
                closestTime = timestamp;
            }

            // Optimization: if we find exact match or very close, stop
            if (diff < 0.016) { // ~1 frame at 60fps
                break;
            }
        }

        if (closestTime !== null) {
            return this.telemetryIndex.get(closestTime);
        }

        return null;
    }

    /**
     * Get all telemetry data (for export or analysis)
     */
    getAllTelemetry() {
        return Array.from(this.telemetryIndex.entries()).map(([timestamp, data]) => ({
            timestamp,
            ...data
        }));
    }

    /**
     * Check if telemetry data exists
     */
    hasTelemetry() {
        return this.telemetryIndex.size > 0;
    }

    /**
     * Get telemetry statistics
     */
    getStatistics() {
        if (!this.hasTelemetry()) {
            return null;
        }

        const allData = this.getAllTelemetry();

        // Calculate statistics
        const speeds = allData.map(d => d.speed.mph).filter(s => s > 0);
        const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
        const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

        const autopilotFrames = allData.filter(d => d.autopilot.isActive).length;
        const autopilotPercentage = (autopilotFrames / allData.length) * 100;

        return {
            frameCount: allData.length,
            duration: this.duration,
            frameRate: this.frameRate,
            speed: {
                max: maxSpeed,
                average: avgSpeed
            },
            autopilot: {
                framesActive: autopilotFrames,
                percentageActive: autopilotPercentage
            }
        };
    }

    /**
     * Format telemetry for display
     */
    static formatSpeed(speed, unit = 'mph') {
        if (!speed) return '--';
        const value = unit === 'mph' ? speed.mph : speed.kph;
        return Math.round(value);
    }

    static formatSteeringAngle(angle) {
        if (angle === null || angle === undefined) return '--';
        return `${Math.round(angle)}°`;
    }

    static formatPercentage(value) {
        if (value === null || value === undefined) return '--';
        return `${Math.round(value)}%`;
    }

    static formatGPS(gps) {
        if (!gps || !gps.isValid) return '--';
        return `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`;
    }
}
