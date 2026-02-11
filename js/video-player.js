/**
 * Video Player Module
 * Handles video playback, controls, and event management
 */

export class VideoPlayer {
    constructor(videoElementId) {
        this.videoElement = document.getElementById(videoElementId);
        if (!this.videoElement) {
            throw new Error(`Video element with id "${videoElementId}" not found`);
        }

        this.callbacks = {
            onLoadedMetadata: null,
            onTimeUpdate: null,
            onError: null
        };

        this.currentTime = 0;
        this.duration = 0;
        this.isPlaying = false;

        this.setupEventListeners();
    }

    /**
     * Setup video event listeners
     */
    setupEventListeners() {
        // Metadata loaded (duration, dimensions available)
        this.videoElement.addEventListener('loadedmetadata', () => {
            this.duration = this.videoElement.duration;
            if (this.callbacks.onLoadedMetadata) {
                this.callbacks.onLoadedMetadata({
                    duration: this.duration,
                    width: this.videoElement.videoWidth,
                    height: this.videoElement.videoHeight,
                    videoElement: this.videoElement
                });
            }
        });

        // Time update (fires during playback)
        this.videoElement.addEventListener('timeupdate', () => {
            this.currentTime = this.videoElement.currentTime;

            if (this.callbacks.onTimeUpdate) {
                this.callbacks.onTimeUpdate({
                    currentTime: this.currentTime,
                    duration: this.duration,
                    percentage: (this.currentTime / this.duration) * 100
                });
            }
        });

        // Play event
        this.videoElement.addEventListener('play', () => {
            this.isPlaying = true;
            if (this.callbacks.onPlay) {
                this.callbacks.onPlay();
            }
        });

        // Pause event
        this.videoElement.addEventListener('pause', () => {
            this.isPlaying = false;
            if (this.callbacks.onPause) {
                this.callbacks.onPause();
            }
        });

        // Ended event
        this.videoElement.addEventListener('ended', () => {
            this.isPlaying = false;
            if (this.callbacks.onEnded) {
                this.callbacks.onEnded();
            }
        });

        // Error event
        this.videoElement.addEventListener('error', (e) => {
            const error = this.videoElement.error;
            const errorMessage = this.getErrorMessage(error);

            console.error('Video error:', errorMessage, error);

            if (this.callbacks.onError) {
                this.callbacks.onError({
                    message: errorMessage,
                    code: error?.code,
                    error
                });
            }
        });

    }

    /**
     * Load video from object URL
     */
    loadVideo(objectURL) {
        return new Promise((resolve, reject) => {
            // Reset video state
            this.videoElement.pause();
            this.currentTime = 0;
            this.duration = 0;

            // Set video source
            this.videoElement.src = objectURL;

            // Wait for metadata to load
            const onMetadata = () => {
                this.videoElement.removeEventListener('loadedmetadata', onMetadata);
                this.videoElement.removeEventListener('error', onError);
                resolve({
                    duration: this.videoElement.duration,
                    width: this.videoElement.videoWidth,
                    height: this.videoElement.videoHeight
                });
            };

            const onError = (e) => {
                this.videoElement.removeEventListener('loadedmetadata', onMetadata);
                this.videoElement.removeEventListener('error', onError);
                reject(new Error(this.getErrorMessage(this.videoElement.error)));
            };

            this.videoElement.addEventListener('loadedmetadata', onMetadata);
            this.videoElement.addEventListener('error', onError);

            // Trigger load
            this.videoElement.load();
        });
    }

    /**
     * Get user-friendly error message
     */
    getErrorMessage(error) {
        if (!error) return 'Unknown video error';

        const errorMessages = {
            1: 'Video loading aborted',
            2: 'Network error while loading video',
            3: 'Video decoding failed. The video format may not be supported by your browser.',
            4: 'Video format not supported. Try converting to H.264 codec.'
        };

        return errorMessages[error.code] || `Video error (code ${error.code})`;
    }

    /**
     * Play video
     */
    play() {
        const playPromise = this.videoElement.play();

        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Play error:', error);
                // Autoplay might be blocked by browser
                if (error.name === 'NotAllowedError') {
                    console.warn('Autoplay blocked. User interaction required.');
                }
            });
        }

        return playPromise;
    }

    /**
     * Pause video
     */
    pause() {
        this.videoElement.pause();
    }

    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Seek to specific time
     */
    seek(time) {
        if (!isFinite(time)) return;
        if (time >= 0 && time <= this.duration) {
            this.videoElement.currentTime = time;
        }
    }

    /**
     * Set playback speed
     */
    setPlaybackSpeed(speed) {
        const validSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
        if (validSpeeds.includes(speed)) {
            this.videoElement.playbackRate = speed;
        } else {
            console.warn(`Invalid playback speed: ${speed}`);
        }
    }

    /**
     * Get current playback speed
     */
    getPlaybackSpeed() {
        return this.videoElement.playbackRate;
    }

    /**
     * Format time in MM:SS or HH:MM:SS
     */
    static formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) {
            return '--:--';
        }

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        } else {
            return `${minutes}:${String(secs).padStart(2, '0')}`;
        }
    }

    /**
     * Register callback for loaded metadata event
     */
    onLoadedMetadata(callback) {
        this.callbacks.onLoadedMetadata = callback;
    }

    /**
     * Register callback for time update event
     */
    onTimeUpdate(callback) {
        this.callbacks.onTimeUpdate = callback;
    }

    /**
     * Register callback for error event
     */
    onError(callback) {
        this.callbacks.onError = callback;
    }

    /**
     * Get current state
     */
    getState() {
        return {
            currentTime: this.currentTime,
            duration: this.duration,
            isPlaying: this.isPlaying,
            playbackRate: this.videoElement.playbackRate,
            volume: this.videoElement.volume,
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight
        };
    }

    /**
     * Reset video player
     */
    reset() {
        this.pause();
        this.videoElement.src = '';
        this.currentTime = 0;
        this.duration = 0;
    }
}
