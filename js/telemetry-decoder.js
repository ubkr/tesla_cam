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

        // DEBUG: Check frame sequence numbers in first few messages
        const firstFrameNums = seiMessages.slice(0, 10).map((msg, i) => ({
            index: i,
            frameSeqNo: msg.frameSeqNo,
            frame_seq_no: msg.frame_seq_no,
            speed_mps: msg.vehicleSpeedMps || msg.vehicle_speed_mps
        }));
        console.log('DEBUG: First 10 SEI messages frame numbers and speeds:', firstFrameNums);

        // Process each SEI message
        for (let i = 0; i < seiMessages.length; i++) {
            const seiData = seiMessages[i];

            // Decode and convert units
            const telemetry = this.decodeSEIMessage(seiData, i);

            // Calculate video timestamp from frame sequence number
            // Use frame_seq_no if available, otherwise use index
            const frameNumber = seiData.frameSeqNo || seiData.frame_seq_no || i;
            const timestamp = frameNumber / this.frameRate;

            // Add to index
            this.telemetryIndex.set(timestamp, telemetry);
        }

        console.log(`Telemetry index built: ${this.telemetryIndex.size} entries`);

        // DEBUG: Show first 20 entries with their data to verify variety
        const entries = Array.from(this.telemetryIndex.entries()).slice(0, 20);
        console.log('DEBUG: First 20 telemetry entries (timestamp -> data):');
        entries.forEach(([timestamp, data]) => {
            console.log(`  ${timestamp.toFixed(3)}s -> speed: ${data.speed.mph.toFixed(1)} mph, gear: ${data.gear.name}, frame: ${data.frameSeqNo}`);
        });

        // DEBUG: Show timestamp range
        const timestamps = Array.from(this.telemetryIndex.keys());
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        console.log(`DEBUG: Timestamp range: ${minTime.toFixed(3)}s to ${maxTime.toFixed(3)}s (video duration: ${duration.toFixed(3)}s)`);

        return this.telemetryIndex.size;
    }

    /**
     * Decode single SEI message and convert units
     */
    decodeSEIMessage(seiData, index) {
        // Convert speed from m/s to mph and kph
        const speedMps = seiData.vehicleSpeedMps || seiData.vehicle_speed_mps || 0;
        const speedMph = speedMps * MPS_TO_MPH;
        const speedKph = speedMps * MPS_TO_KPH;

        // Get steering angle
        const steeringAngle = seiData.steeringWheelAngle || seiData.steering_wheel_angle || 0;

        // Get pedal positions (0-1 scale to percentage)
        const accelerator = (seiData.acceleratorPedalPosition || seiData.accelerator_pedal_position || 0) * 100;

        // Get brake status
        const brakeApplied = seiData.brakeApplied || seiData.brake_applied || false;

        // Get turn signals
        const leftSignal = seiData.blinkerOnLeft || seiData.blinker_on_left || false;
        const rightSignal = seiData.blinkerOnRight || seiData.blinker_on_right || false;

        // Get autopilot state
        const autopilotState = seiData.autopilotState || seiData.autopilot_state || 0;
        const autopilotName = AUTOPILOT_STATES[autopilotState] || 'OFF';

        // Get gear state
        const gearState = seiData.gearState || seiData.gear_state || 0;
        const gearName = GEAR_STATES[gearState] || 'P';

        // Get GPS coordinates
        const latitude = seiData.latitudeDeg || seiData.latitude_deg || null;
        const longitude = seiData.longitudeDeg || seiData.longitude_deg || null;
        const heading = seiData.headingDeg || seiData.heading_deg || null;

        // Get linear acceleration
        const accelX = seiData.linearAccelerationMps2X || seiData.linear_acceleration_mps2_x || 0;
        const accelY = seiData.linearAccelerationMps2Y || seiData.linear_acceleration_mps2_y || 0;
        const accelZ = seiData.linearAccelerationMps2Z || seiData.linear_acceleration_mps2_z || 0;

        // Get frame sequence number
        const frameSeqNo = seiData.frameSeqNo || seiData.frame_seq_no || index;

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
            const data = this.telemetryIndex.get(closestTime);

            // DEBUG: Sample some lookups to verify we're getting different data
            if (Math.random() < 0.05) { // Log 5% of lookups
                console.log(`DEBUG getTelemetryAtTime: video time=${time.toFixed(3)}s -> telemetry time=${closestTime.toFixed(3)}s (diff=${minDiff.toFixed(4)}s) -> speed=${data.speed.mph.toFixed(1)} mph, frame=${data.frameSeqNo}`);
            }

            return data;
        }

        console.warn('DEBUG: No telemetry found for time:', time, 'closest was:', closestTime, 'minDiff:', minDiff);
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
