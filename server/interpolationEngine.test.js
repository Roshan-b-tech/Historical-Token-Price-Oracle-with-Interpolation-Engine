import { InterpolationEngine } from './index.js';

describe('InterpolationEngine.interpolate', () => {
    it('should interpolate correctly between two points', () => {
        // ts_q is halfway between ts_before and ts_after
        const result = InterpolationEngine.interpolate(15, 10, 100, 20, 200);
        expect(result).toBe(150);
    });

    it('should return price_before if ts_q == ts_before', () => {
        const result = InterpolationEngine.interpolate(10, 10, 100, 20, 200);
        expect(result).toBe(100);
    });

    it('should return price_after if ts_q == ts_after', () => {
        const result = InterpolationEngine.interpolate(20, 10, 100, 20, 200);
        expect(result).toBe(200);
    });

    it('should extrapolate if ts_q is outside the range', () => {
        // Extrapolate before
        const resultBefore = InterpolationEngine.interpolate(5, 10, 100, 20, 200);
        expect(resultBefore).toBe(50);
        // Extrapolate after
        const resultAfter = InterpolationEngine.interpolate(25, 10, 100, 20, 200);
        expect(resultAfter).toBe(250);
    });

    it('should handle negative prices', () => {
        const result = InterpolationEngine.interpolate(15, 10, -100, 20, 100);
        expect(result).toBe(0);
    });
}); 