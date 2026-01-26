/**
 * Settings Module
 * Manages user settings with localStorage persistence
 */

const DEFAULT_SETTINGS = {
    speedUnit: 'mph',
    overlayVisible: true,
    overlayStyle: 'detailed',
    timelineVisible: true
};

export class Settings {
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.callbacks = {
            onSpeedUnitChange: null,
            onOverlayVisibilityChange: null,
            onOverlayStyleChange: null,
            onTimelineVisibilityChange: null
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

        // Timeline visibility toggle
        const timelineVisibleToggle = document.getElementById('timelineVisibleToggle');
        if (timelineVisibleToggle) {
            timelineVisibleToggle.addEventListener('change', (e) => {
                this.setTimelineVisible(e.target.checked);
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

        // Timeline visibility
        const timelineVisibleToggle = document.getElementById('timelineVisibleToggle');
        if (timelineVisibleToggle) {
            timelineVisibleToggle.checked = this.settings.timelineVisible;
        }

        // Apply dashboard visibility
        this.applyDashboardVisibility();

        // Apply overlay style
        this.applyOverlayStyle();

        // Apply timeline visibility
        this.applyTimelineVisibility();
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

        this.applyDashboardVisibility();

        // Update checkbox in settings panel
        const checkbox = document.getElementById('overlayVisibleToggle');
        if (checkbox) {
            checkbox.checked = visible;
        }

        // Trigger callback
        if (this.callbacks.onOverlayVisibilityChange) {
            this.callbacks.onOverlayVisibilityChange(visible);
        }

        console.log('Dashboard visibility changed to:', visible);
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
     * Apply dashboard visibility
     */
    applyDashboardVisibility() {
        const dashboardGrid = document.querySelector('.dashboard-grid');

        if (dashboardGrid) {
            if (this.settings.overlayVisible) {
                dashboardGrid.classList.remove('hidden');
            } else {
                dashboardGrid.classList.add('hidden');
            }
        }

        // Update toggle button icon
        this.updateToggleButtonIcon();
    }

    /**
     * Update toggle button icon to match current visibility state
     */
    updateToggleButtonIcon() {
        const toggleBtn = document.getElementById('toggleOverlayBtn');

        if (toggleBtn) {
            if (this.settings.overlayVisible) {
                // Eye icon (visible state)
                toggleBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 3c-3.5 0-6.5 2.5-7.5 5.5 1 3 4 5.5 7.5 5.5s6.5-2.5 7.5-5.5C14.5 5.5 11.5 3 8 3zm0 9c-2 0-3.5-1.5-3.5-3.5S6 5 8 5s3.5 1.5 3.5 3.5S10 12 8 12zm0-6c-1.4 0-2.5 1.1-2.5 2.5S6.6 11 8 11s2.5-1.1 2.5-2.5S9.4 6 8 6z"/>
                    </svg>
                `;
                toggleBtn.title = 'Hide telemetry dashboard';
            } else {
                // Eye-slash icon (hidden state)
                toggleBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.5 8.5c-.5 1-1.2 1.8-2 2.4l1.4 1.4c1-1 1.8-2.2 2.3-3.3-1-3-4-5.5-7.5-5.5-1 0-1.9.2-2.8.5l1.5 1.5c.4-.1.8-.2 1.3-.2 2 0 3.5 1.5 3.5 3.5 0 .4-.1.9-.2 1.3l1.5 1.5zm-5.5 3.3c-2 0-3.5-1.5-3.5-3.5 0-.5.1-.9.2-1.3L1.3 3.7l1-1 11 11-1 1-2.3-2.3c-.8.3-1.7.4-2.5.4zm-2-3.5c0 1.1.9 2 2 2l-2-2z"/>
                    </svg>
                `;
                toggleBtn.title = 'Show telemetry dashboard';
            }
        }
    }

    /**
     * Apply overlay style
     */
    applyOverlayStyle() {
        const dashboard = document.getElementById('telemetryDashboard');
        if (dashboard) {
            dashboard.classList.remove('minimal', 'detailed');
            dashboard.classList.add(this.settings.overlayStyle);
        }
    }

    /**
     * Set timeline visibility
     */
    setTimelineVisible(visible) {
        this.settings.timelineVisible = visible;
        this.saveSettings();

        this.applyTimelineVisibility();

        // Update checkbox in settings panel
        const checkbox = document.getElementById('timelineVisibleToggle');
        if (checkbox) {
            checkbox.checked = visible;
        }

        // Trigger callback
        if (this.callbacks.onTimelineVisibilityChange) {
            this.callbacks.onTimelineVisibilityChange(visible);
        }

        console.log('Timeline visibility changed to:', visible);
    }

    /**
     * Apply timeline visibility
     */
    applyTimelineVisibility() {
        const timeline = document.getElementById('customTimeline');
        if (timeline) {
            if (this.settings.timelineVisible) {
                timeline.classList.remove('hidden');
            } else {
                timeline.classList.add('hidden');
            }
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
     * Register callback for timeline visibility changes
     */
    onTimelineVisibilityChange(callback) {
        this.callbacks.onTimelineVisibilityChange = callback;
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
