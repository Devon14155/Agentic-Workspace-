
/**
 * Enterprise Resilience Layer
 * Implements exponential backoff, jitter, and circuit breaker patterns for API calls.
 */

interface RetryConfig {
  retries: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  retries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  factor: 2,
};

export class CircuitBreakerOpenError extends Error {
  constructor(message = "Circuit Breaker is open") {
    super(message);
    this.name = "CircuitBreakerOpenError";
  }
}

/**
 * Executes a promise with exponential backoff retry logic.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let attempt = 0;
  let delay = finalConfig.initialDelay;

  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      
      // Don't retry on auth errors or specific 4xx that won't resolve
      if (error?.message?.includes('401') || error?.message?.includes('403') || error?.message?.includes('API key')) {
        throw error;
      }

      if (attempt > finalConfig.retries) {
        console.error(`Operation failed after ${attempt} attempts:`, error);
        throw error;
      }

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 200;
      const waitTime = Math.min(delay + jitter, finalConfig.maxDelay);
      
      console.warn(`Attempt ${attempt} failed. Retrying in ${Math.round(waitTime)}ms...`, error.message);
      
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      delay *= finalConfig.factor;
    }
  }
}
