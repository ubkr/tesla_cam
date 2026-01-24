/**
 * MP4 Parser Module
 * Wrapper for Tesla's dashcam-mp4.js library
 * Handles MP4 parsing and SEI extraction using Web Worker for performance
 */

export class MP4Parser {
    constructor() {
        this.worker = null;
        this.SeiMetadata = null;
        this.enumFields = null;
    }

    /**
     * Initialize protobuf (must be called before parsing)
     */
    async initializeProtobuf() {
        if (this.SeiMetadata) {
            return { SeiMetadata: this.SeiMetadata, enumFields: this.enumFields };
        }

        try {
            // Use DashcamHelpers to initialize protobuf
            const result = await window.DashcamHelpers.initProtobuf('lib/dashcam.proto');
            this.SeiMetadata = result.SeiMetadata;
            this.enumFields = result.enumFields;
            return result;
        } catch (error) {
            console.error('Failed to initialize protobuf:', error);
            throw new Error('Failed to load telemetry decoder. Please check console for details.');
        }
    }

    /**
     * Parse MP4 file and extract SEI messages
     * Uses Web Worker for performance on large files
     */
    async parseFile(file, options = {}) {
        const { useWorker = true, onProgress = null } = options;

        // Initialize protobuf first
        await this.initializeProtobuf();

        if (useWorker && typeof Worker !== 'undefined') {
            return this.parseFileWithWorker(file, onProgress);
        } else {
            return this.parseFileDirectly(file, onProgress);
        }
    }

    /**
     * Parse file using Web Worker (non-blocking)
     */
    async parseFileWithWorker(file, onProgress) {
        return new Promise((resolve, reject) => {
            // Create worker
            this.worker = new Worker('js/mp4-worker.js');

            // Handle messages from worker
            this.worker.onmessage = (e) => {
                const { type, data } = e.data;

                switch (type) {
                    case 'progress':
                        if (onProgress) {
                            onProgress(data);
                        }
                        break;

                    case 'complete':
                        this.worker.terminate();
                        this.worker = null;
                        resolve(data);
                        break;

                    case 'error':
                        this.worker.terminate();
                        this.worker = null;
                        reject(new Error(data.message));
                        break;
                }
            };

            this.worker.onerror = (error) => {
                console.error('Worker error:', error);
                this.worker.terminate();
                this.worker = null;
                reject(new Error('MP4 parsing failed in worker'));
            };

            // Read file as ArrayBuffer
            const reader = new FileReader();

            reader.onload = (e) => {
                // Send data to worker
                this.worker.postMessage({
                    type: 'parse',
                    buffer: e.target.result,
                    protoPath: 'lib/dashcam.proto'
                }, [e.target.result]); // Transfer ownership of buffer to worker
            };

            reader.onerror = () => {
                if (this.worker) {
                    this.worker.terminate();
                    this.worker = null;
                }
                reject(new Error('Failed to read file'));
            };

            // Start reading file
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Parse file directly in main thread (blocking, but simpler)
     */
    async parseFileDirectly(file, onProgress) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    if (onProgress) onProgress({ percentage: 25, message: 'Reading file...' });

                    const buffer = e.target.result;
                    const parser = new window.DashcamMP4(buffer);

                    if (onProgress) onProgress({ percentage: 50, message: 'Parsing MP4...' });

                    // Extract SEI messages
                    const seiMessages = parser.extractSeiMessages(this.SeiMetadata);

                    if (onProgress) onProgress({ percentage: 75, message: 'Processing telemetry...' });

                    // Get video config
                    const config = parser.getConfig();

                    if (onProgress) onProgress({ percentage: 100, message: 'Complete' });

                    resolve({
                        seiMessages,
                        config,
                        hasTelemetry: seiMessages.length > 0
                    });
                } catch (error) {
                    console.error('MP4 parsing error:', error);
                    reject(new Error('Failed to parse MP4 file. ' + error.message));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Cancel ongoing parsing
     */
    cancel() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }

    /**
     * Check if file has telemetry data (quick check)
     */
    static async quickCheckForTelemetry(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();

            // Only read first 10MB to check for SEI data
            const blob = file.slice(0, 10 * 1024 * 1024);

            reader.onload = async (e) => {
                try {
                    const buffer = e.target.result;
                    const view = new DataView(buffer);

                    // Quick scan for SEI NAL units (type 6)
                    let hasSei = false;
                    for (let i = 0; i < buffer.byteLength - 4; i++) {
                        const nalSize = view.getUint32(i);
                        if (nalSize > 0 && nalSize < 100000 && i + 4 + nalSize <= buffer.byteLength) {
                            const nalType = view.getUint8(i + 4) & 0x1F;
                            if (nalType === 6) {
                                hasSei = true;
                                break;
                            }
                        }
                    }

                    resolve(hasSei);
                } catch (error) {
                    resolve(false);
                }
            };

            reader.onerror = () => resolve(false);
            reader.readAsArrayBuffer(blob);
        });
    }
}
