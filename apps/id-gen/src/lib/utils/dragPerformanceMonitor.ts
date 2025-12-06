/**
 * Drag Performance Monitor
 *
 * Monitors frame rates and performance during drag operations to provide
 * adaptive quality and debugging information.
 */

export interface PerformanceMetrics {
	fps: number;
	averageFps: number;
	dragDuration: number;
	frameCount: number;
	proxyUsageCount: number;
	adaptiveQualityEnabled: boolean;
}

export interface DragSession {
	startTime: number;
	frameCount: number;
	lastFrameTime: number;
	sessionId: string;
}

export class DragPerformanceMonitor {
	private frameCount = 0;
	private lastTime = performance.now();
	private currentFPS = 60;
	private isMonitoring = false;
	private fpsHistory: number[] = [];
	private maxHistorySize = 30;
	private activeDragSession: DragSession | null = null;
	private monitoringCallback: (() => void) | null = null;

	// Performance thresholds
	private readonly OPTIMAL_FPS = 60;
	private readonly ACCEPTABLE_FPS = 30;
	private readonly POOR_FPS = 15;

	/**
	 * Start monitoring performance during a drag operation
	 */
	startDragMonitoring(sessionId?: string): DragSession {
		this.activeDragSession = {
			startTime: performance.now(),
			frameCount: 0,
			lastFrameTime: performance.now(),
			sessionId: sessionId || `drag_${Date.now()}`
		};

		if (!this.isMonitoring) {
			this.startMonitoring();
		}

		console.log(`🎯 Started drag performance monitoring: ${this.activeDragSession.sessionId}`);
		return this.activeDragSession;
	}

	/**
	 * End drag monitoring and return performance metrics
	 */
	endDragMonitoring(): PerformanceMetrics | null {
		if (!this.activeDragSession) {
			console.warn('⚠️ No active drag session to end');
			return null;
		}

		const session = this.activeDragSession;
		const endTime = performance.now();
		const dragDuration = endTime - session.startTime;
		const averageFps = this.getAverageFPS();

		const metrics: PerformanceMetrics = {
			fps: this.currentFPS,
			averageFps,
			dragDuration,
			frameCount: session.frameCount,
			proxyUsageCount: 0, // To be updated by external systems
			adaptiveQualityEnabled: this.shouldUseAdaptiveQuality()
		};

		console.log(`✅ Drag session complete: ${session.sessionId}`, {
			duration: `${dragDuration.toFixed(1)}ms`,
			averageFPS: averageFps.toFixed(1),
			frameCount: session.frameCount,
			performance: this.getPerformanceRating(averageFps)
		});

		this.activeDragSession = null;
		this.stopMonitoring();

		return metrics;
	}

	/**
	 * Start continuous FPS monitoring
	 */
	private startMonitoring(): void {
		this.isMonitoring = true;
		this.frameCount = 0;
		this.lastTime = performance.now();
		this.trackFrame();
	}

	/**
	 * Stop FPS monitoring
	 */
	private stopMonitoring(): void {
		this.isMonitoring = false;
		if (this.monitoringCallback) {
			this.monitoringCallback = null;
		}
	}

	/**
	 * Track individual frame for FPS calculation
	 */
	private trackFrame(): void {
		if (!this.isMonitoring) return;

		const now = performance.now();
		this.frameCount++;

		// Update active drag session frame count
		if (this.activeDragSession) {
			this.activeDragSession.frameCount++;
			this.activeDragSession.lastFrameTime = now;
		}

		// Calculate FPS every second
		if (now - this.lastTime >= 1000) {
			this.currentFPS = this.frameCount;
			this.frameCount = 0;
			this.lastTime = now;

			// Store in history
			this.fpsHistory.push(this.currentFPS);
			if (this.fpsHistory.length > this.maxHistorySize) {
				this.fpsHistory.shift();
			}

			// Check for performance issues
			this.checkPerformanceThresholds();
		}

		// Continue monitoring
		if (this.isMonitoring) {
			requestAnimationFrame(() => this.trackFrame());
		}
	}

	/**
	 * Check performance thresholds and suggest adaptations
	 */
	private checkPerformanceThresholds(): void {
		if (this.currentFPS < this.POOR_FPS) {
			console.warn(
				`⚡ Poor performance detected: ${this.currentFPS}fps - Consider enabling aggressive optimization`
			);
		} else if (this.currentFPS < this.ACCEPTABLE_FPS) {
			console.warn(
				`⚠️ Suboptimal performance: ${this.currentFPS}fps - Consider enabling low-quality mode`
			);
		}
	}

	/**
	 * Get current FPS
	 */
	getCurrentFPS(): number {
		return this.currentFPS;
	}

	/**
	 * Get average FPS from recent history
	 */
	getAverageFPS(): number {
		if (this.fpsHistory.length === 0) return this.currentFPS;
		return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
	}

	/**
	 * Get performance rating based on FPS
	 */
	getPerformanceRating(fps?: number): 'excellent' | 'good' | 'acceptable' | 'poor' {
		const targetFPS = fps ?? this.currentFPS;

		if (targetFPS >= this.OPTIMAL_FPS) return 'excellent';
		if (targetFPS >= this.ACCEPTABLE_FPS) return 'good';
		if (targetFPS >= this.POOR_FPS) return 'acceptable';
		return 'poor';
	}

	/**
	 * Determine if adaptive quality should be enabled based on performance
	 */
	shouldUseAdaptiveQuality(): boolean {
		const avgFPS = this.getAverageFPS();
		return avgFPS < this.ACCEPTABLE_FPS;
	}

	/**
	 * Get recommended proxy settings based on current performance
	 */
	getRecommendedProxySettings(): { maxDimension: number; quality: number } {
		const avgFPS = this.getAverageFPS();

		if (avgFPS >= this.OPTIMAL_FPS) {
			return { maxDimension: 800, quality: 0.9 };
		} else if (avgFPS >= this.ACCEPTABLE_FPS) {
			return { maxDimension: 600, quality: 0.8 };
		} else if (avgFPS >= this.POOR_FPS) {
			return { maxDimension: 400, quality: 0.7 };
		} else {
			return { maxDimension: 300, quality: 0.6 };
		}
	}

	/**
	 * Get comprehensive performance stats
	 */
	getPerformanceStats(): {
		current: PerformanceMetrics;
		history: number[];
		recommendations: {
			useProxy: boolean;
			proxySettings: { maxDimension: number; quality: number };
			performanceRating: string;
		};
	} {
		const current: PerformanceMetrics = {
			fps: this.currentFPS,
			averageFps: this.getAverageFPS(),
			dragDuration: this.activeDragSession
				? performance.now() - this.activeDragSession.startTime
				: 0,
			frameCount: this.activeDragSession?.frameCount || 0,
			proxyUsageCount: 0,
			adaptiveQualityEnabled: this.shouldUseAdaptiveQuality()
		};

		return {
			current,
			history: [...this.fpsHistory],
			recommendations: {
				useProxy: this.shouldUseAdaptiveQuality(),
				proxySettings: this.getRecommendedProxySettings(),
				performanceRating: this.getPerformanceRating()
			}
		};
	}

	/**
	 * Reset all monitoring data
	 */
	reset(): void {
		this.frameCount = 0;
		this.currentFPS = 60;
		this.fpsHistory = [];
		this.activeDragSession = null;
		this.stopMonitoring();
		console.log('🔄 Performance monitor reset');
	}
}

// Global performance monitor instance
export const globalDragPerformanceMonitor = new DragPerformanceMonitor();

/**
 * Performance tracking hook for components
 */
export function usePerformanceMonitoring() {
	return {
		startDrag: (sessionId?: string) => globalDragPerformanceMonitor.startDragMonitoring(sessionId),
		endDrag: () => globalDragPerformanceMonitor.endDragMonitoring(),
		getStats: () => globalDragPerformanceMonitor.getPerformanceStats(),
		getCurrentFPS: () => globalDragPerformanceMonitor.getCurrentFPS(),
		shouldUseProxy: () => globalDragPerformanceMonitor.shouldUseAdaptiveQuality()
	};
}
