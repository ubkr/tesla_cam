/**
 * MP4 Worker
 * Web Worker for parsing MP4 files in the background
 * Prevents UI blocking on large files
 */

// Import dependencies (workers have their own scope)
// Note: Paths are relative to the HTML document, not this worker file
importScripts('lib/protobuf.min.js', 'lib/dashcam-mp4.js');

let SeiMetadata = null;

/**
 * Initialize protobuf in worker context
 */
async function initializeProtobuf(protoPath) {
    if (SeiMetadata) return;

    try {
        const response = await fetch(protoPath);
        const protoText = await response.text();
        const root = protobuf.parse(protoText).root;
        SeiMetadata = root.lookupType('SeiMetadata');
    } catch (error) {
        throw new Error('Failed to load protobuf: ' + error.message);
    }
}

/**
 * Parse MP4 buffer and extract SEI messages
 */
function parseMP4(buffer) {
    try {
        // Update progress
        postMessage({ type: 'progress', data: { percentage: 25, message: 'Parsing MP4 structure...' } });

        // Create parser
        const parser = new DashcamMP4(buffer);

        // Update progress
        postMessage({ type: 'progress', data: { percentage: 50, message: 'Extracting telemetry data...' } });

        // Extract SEI messages
        const seiMessages = parser.extractSeiMessages(SeiMetadata);

        // Update progress
        postMessage({ type: 'progress', data: { percentage: 75, message: 'Processing metadata...' } });

        // Get video config
        const config = parser.getConfig();

        // Update progress
        postMessage({ type: 'progress', data: { percentage: 100, message: 'Complete' } });

        // Return results
        return {
            seiMessages,
            config,
            hasTelemetry: seiMessages.length > 0
        };
    } catch (error) {
        throw new Error('MP4 parsing failed: ' + error.message);
    }
}

/**
 * Handle messages from main thread
 */
self.onmessage = async function(e) {
    const { type, buffer, protoPath } = e.data;

    if (type === 'parse') {
        try {
            // Initialize protobuf
            postMessage({ type: 'progress', data: { percentage: 10, message: 'Initializing decoder...' } });
            await initializeProtobuf(protoPath || 'lib/dashcam.proto');

            // Parse MP4
            const result = parseMP4(buffer);

            // Send results back
            postMessage({ type: 'complete', data: result });
        } catch (error) {
            console.error('Worker error:', error);
            postMessage({ type: 'error', data: { message: error.message } });
        }
    }
};
