/**
 * Settings Module
 * Manages user settings with localStorage persistence
 */

const DEFAULT_SETTINGS = {
    speedUnit: 'mph',
    overlayVisible: true,
    overlayStyle: 'detailed'
};

export class Settings {
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.callbacks = {
            onSpeedUnitChange: null,
            onOverlayVisibilityChange: null,
            onOverlayStyleChange: null
        };
    }

    /**
     * Initialize settings from localStorage
     */
    initialize() {
        // Load settings from localStorage
        this.loadSettings();

        // Setup UI event listeners
        this.setupEventListeners();

        // Apply initial settings to UI
        this.applySettingsToUI();

        console.log('Settings initialized:', this.settings);
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem('teslaDashcamSettings');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.settings = { ...DEFAULT_SETTINGS, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.settings = { ...DEFAULT_SETTINGS };
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('teslaDashcamSettings', JSON.stringify(this.settings));
            console.log('Settings saved:', this.settings);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Setup event listeners for settings controls
     */
    setupEventListeners() {
        // Speed unit selector
        const speedUnitSelect = document.getElementById('speedUnitSelect');
        if (speedUnitSelect) {
            speedUnitSelect.addEventListener('change', (e) => {
                this.setSpeedUnit(e.target.value);
            });
        }

        // Overlay visibility toggle
        const overlayVisibleToggle = document.getElementById('overlayVisibleToggle');
        if (overlayVisibleToggle) {
            overlayVisibleToggle.addEventListener('change', (e) => {
                this.setOverlayVisible(e.target.checked);
            });
        }

        // Overlay style selector
        const overlayStyleSelect = document.getElementById('overlayStyleSelect');
        if (overlayStyleSelect) {
            overlayStyleSelect.addEventListener('change', (e) => {
                this.setOverlayStyle(e.target.value);
            });
        }
    }

    /**
     * Apply current settings to UI controls
     */
    applySettingsToUI() {
        // Speed unit
        const speedUnitSelect = document.getElementById('speedUnitSelect');
        if (speedUnitSelect) {
            speedUnitSelect.value = this.settings.speedUnit;
        }

        // Overlay visibility
        const overlayVisibleToggle = document.getElementById('overlayVisibleToggle');
        if (overlayVisibleToggle) {
            overlayVisibleToggle.checked = this.settings.overlayVisible;
        }

        // Overlay style
        const overlayStyleSelect = document.getElementById('overlayStyleSelect');
        if (overlayStyleSelect) {
            overlayStyleSelect.value = this.settings.overlayStyle;
        }

        // Apply overlay visibility to actual overlay
        this.applyOverlayVisibility();

        // Apply overlay style
        this.applyOverlayStyle();
    }

    /**
     * Set speed unit
     */
    setSpeedUnit(unit) {
        if (unit !== 'mph' && unit !== 'kph') {
            console.warn('Invalid speed unit:', unit);
            return;
        }

        this.settings.speedUnit = unit;
        this.saveSettings();

        // Update localStorage for quick access
        localStorage.setItem('speedUnit', unit);

        // Trigger callback
        if (this.callbacks.onSpeedUnitChange) {
            this.callbacks.onSpeedUnitChange(unit);
        }

        console.log('Speed unit changed to:', unit);
    }

    /**
     * Set overlay visibility
     */
    setOverlayVisible(visible) {
        this.settings.overlayVisible = visible;
        this.saveSettings();

        this.applyOverlayVisibility();

        // Trigger callback
        if (this.callbacks.onOverlayVisibilityChange) {
            this.callbacks.onOverlayVisibilityChange(visible);
        }

        console.log('Overlay visibility changed to:', visible);
    }

    /**
     * Set overlay style
     */
    setOverlayStyle(style) {
        if (style !== 'detailed' && style !== 'minimal') {
            console.warn('Invalid overlay style:', style);
            return;
        }

        this.settings.overlayStyle = style;
        this.saveSettings();

        this.applyOverlayStyle();

        // Trigger callback
        if (this.callbacks.onOverlayStyleChange) {
            this.callbacks.onOverlayStyleChange(style);
        }

        console.log('Overlay style changed to:', style);
    }

    /**
     * Apply overlay visibility
     */
    applyOverlayVisibility() {
        const overlay = document.getElementById('telemetryOverlay');
        if (overlay) {
            if (this.settings.overlayVisible) {
                overlay.style.display = '';
            } else {
                overlay.style.display = 'none';
            }
        }
    }

    /**
     * Apply overlay style
     */
    applyOverlayStyle() {
        const overlay = document.getElementById('telemetryOverlay');
        if (overlay) {
            overlay.classList.remove('minimal', 'detailed');
            overlay.classList.add(this.settings.overlayStyle);
        }
    }

    /**
     * Get current settings
     */
    get(key) {
        return this.settings[key];
    }

    /**
     * Get all settings
     */
    getAll() {
        return { ...this.settings };
    }

    /**
     * Register callback for speed unit changes
     */
    onSpeedUnitChange(callback) {
        this.callbacks.onSpeedUnitChange = callback;
    }

    /**
     * Register callback for overlay visibility changes
     */
    onOverlayVisibilityChange(callback) {
        this.callbacks.onOverlayVisibilityChange = callback;
    }

    /**
     * Register callback for overlay style changes
     */
    onOverlayStyleChange(callback) {
        this.callbacks.onOverlayStyleChange = callback;
    }

    /**
     * Reset to default settings
     */
    reset() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.saveSettings();
        this.applySettingsToUI();
        console.log('Settings reset to defaults');
    }
}
