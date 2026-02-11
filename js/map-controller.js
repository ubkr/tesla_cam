/**
 * Map Controller Module
 * Handles map initialization, route display, and position updates
 */

export class MapController {
    static isValidCoordinate(lat, lon) {
        return isFinite(lat) && isFinite(lon) &&
            lat >= -90 && lat <= 90 &&
            lon >= -180 && lon <= 180;
    }

    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.currentPositionMarker = null;
        this.routePath = null;
        this.routeCoordinates = [];
    }

    /**
     * Initialize Leaflet map with OpenStreetMap tiles
     */
    initialize(centerLat, centerLon, zoom = 13) {
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.error('Leaflet library not loaded');
            return false;
        }

        try {
            // Initialize map
            this.map = L.map(this.containerId).setView([centerLat, centerLon], zoom);

            // Add OpenStreetMap tile layer
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.map);

            // Add current position marker
            this.currentPositionMarker = L.marker([centerLat, centerLon], {
                title: 'Current Position'
            }).addTo(this.map);

            return true;
        } catch (error) {
            console.error('Failed to initialize map:', error);
            return false;
        }
    }

    /**
     * Build route path from telemetry array
     */
    buildRouteFromTelemetry(telemetryArray) {
        if (!this.map) {
            console.warn('Map not initialized, cannot build route');
            return;
        }


        // Extract valid GPS coordinates
        this.routeCoordinates = telemetryArray
            .filter(t => t.gps && t.gps.isValid &&
                MapController.isValidCoordinate(t.gps.latitude, t.gps.longitude))
            .map(t => [t.gps.latitude, t.gps.longitude]);


        if (this.routeCoordinates.length === 0) {
            console.warn('No valid GPS coordinates found');
            return;
        }

        // Create polyline for route
        this.routePath = L.polyline(this.routeCoordinates, {
            color: '#0080ff',
            weight: 3,
            opacity: 0.7
        }).addTo(this.map);

        // Fit map bounds to show entire route
        this.map.fitBounds(this.routePath.getBounds(), { padding: [50, 50] });

    }

    /**
     * Update current position marker
     */
    updatePosition(latitude, longitude, heading) {
        if (!this.currentPositionMarker) {
            console.warn('Position marker not initialized');
            return;
        }

        if (!MapController.isValidCoordinate(latitude, longitude)) return;

        // Update marker position
        this.currentPositionMarker.setLatLng([latitude, longitude]);

        // Optional: Rotate marker based on heading
        // This would require a custom icon with rotation support
        // For now, we just update the position
    }

    /**
     * Set map visibility
     */
    setVisibility(visible) {
        const container = document.getElementById(this.containerId);
        if (container) {
            if (visible) {
                container.parentElement.classList.remove('hidden');
            } else {
                container.parentElement.classList.add('hidden');
            }
        }

        // Invalidate size to handle resize when showing
        if (visible && this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }

    /**
     * Clean up map instance
     */
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.currentPositionMarker = null;
        this.routePath = null;
        this.routeCoordinates = [];
    }
}
