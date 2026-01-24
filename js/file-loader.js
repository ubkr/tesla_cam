/**
 * File Loader Module
 * Handles file selection, drag-and-drop, validation, and Tesla filename parsing
 */

const TESLA_FILENAME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})-(front|rear|left_repeater|right_repeater|left_pillar|right_pillar)\.mp4$/i;
const MAX_SAFE_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

export class FileLoader {
    constructor() {
        this.fileInput = null;
        this.dropZone = null;
        this.onFileSelectedCallback = null;
        this.currentObjectURL = null;
    }

    /**
     * Initialize file input and drag-and-drop handlers
     */
    initialize(fileInputId, dropZoneId) {
        this.fileInput = document.getElementById(fileInputId);
        this.dropZone = document.getElementById(dropZoneId);

        if (!this.fileInput || !this.dropZone) {
            throw new Error('File input or drop zone element not found');
        }

        this.setupEventListeners();
    }

    /**
     * Set callback for when file is selected
     */
    onFileSelected(callback) {
        this.onFileSelectedCallback = callback;
    }

    /**
     * Setup event listeners for file input and drag-and-drop
     */
    setupEventListeners() {
        // File input change event
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileSelection(file);
            }
        });

        // Drag-and-drop events
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropZone.classList.remove('drag-over');

            const file = e.dataTransfer.files[0];
            if (file) {
                this.handleFileSelection(file);
            }
        });

        // Click on drop zone to trigger file input
        this.dropZone.addEventListener('click', (e) => {
            // Don't trigger if clicking on the file input itself
            if (e.target !== this.fileInput && !e.target.closest('.file-label')) {
                this.fileInput.click();
            }
        });
    }

    /**
     * Handle file selection
     */
    async handleFileSelection(file) {
        try {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Parse filename
            const fileInfo = this.parseFilename(file.name);

            // Warn about large files
            if (file.size > MAX_SAFE_FILE_SIZE) {
                console.warn(`Large file detected (${this.formatFileSize(file.size)}). Performance may be impacted.`);
            }

            // Clean up previous object URL
            this.cleanupObjectURL();

            // Create object URL for video playback
            this.currentObjectURL = URL.createObjectURL(file);

            // Call callback with file info
            if (this.onFileSelectedCallback) {
                this.onFileSelectedCallback({
                    file,
                    objectURL: this.currentObjectURL,
                    ...fileInfo,
                    size: file.size,
                    type: file.type
                });
            }
        } catch (error) {
            if (this.onFileSelectedCallback) {
                this.onFileSelectedCallback({ error: error.message });
            }
        }
    }

    /**
     * Validate file
     */
    validateFile(file) {
        // Check if file exists
        if (!file) {
            return { valid: false, error: 'No file selected' };
        }

        // Check MIME type
        if (!file.type || !file.type.startsWith('video/mp4')) {
            return {
                valid: false,
                error: 'Invalid file type. Please select an MP4 video file.'
            };
        }

        // Check file size (basic sanity check)
        if (file.size === 0) {
            return {
                valid: false,
                error: 'File is empty. Please select a valid video file.'
            };
        }

        // Check if file size is too large (warning, not error)
        if (file.size > 5 * 1024 * 1024 * 1024) { // 5GB
            return {
                valid: false,
                error: 'File is too large (>5GB). Please select a smaller file.'
            };
        }

        return { valid: true };
    }

    /**
     * Parse Tesla dashcam filename
     */
    parseFilename(filename) {
        const match = filename.match(TESLA_FILENAME_PATTERN);

        if (!match) {
            console.warn(`Filename doesn't match Tesla dashcam format: ${filename}`);
            return {
                filename,
                isTeslaFormat: false,
                camera: 'unknown'
            };
        }

        const [, year, month, day, hour, minute, second, camera] = match;

        const timestamp = new Date(
            parseInt(year),
            parseInt(month) - 1, // Month is 0-indexed
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second)
        );

        return {
            filename,
            isTeslaFormat: true,
            timestamp,
            camera: this.normalizeCameraName(camera),
            year,
            month,
            day,
            hour,
            minute,
            second
        };
    }

    /**
     * Normalize camera name for display
     */
    normalizeCameraName(camera) {
        const cameraNames = {
            'front': 'Front',
            'rear': 'Rear',
            'left_repeater': 'Left Repeater',
            'right_repeater': 'Right Repeater',
            'left_pillar': 'Left B-Pillar',
            'right_pillar': 'Right B-Pillar'
        };

        return cameraNames[camera.toLowerCase()] || camera;
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Clean up object URL to free memory
     */
    cleanupObjectURL() {
        if (this.currentObjectURL) {
            URL.revokeObjectURL(this.currentObjectURL);
            this.currentObjectURL = null;
        }
    }

    /**
     * Reset file input
     */
    reset() {
        if (this.fileInput) {
            this.fileInput.value = '';
        }
        this.cleanupObjectURL();
    }
}
