/**
 * API Client Module.
 * 
 * Provides type-safe HTTP client functions for communicating with the YORME-TRICS backend API.
 * Includes timeout handling, error recovery, and CORS troubleshooting.
 * 
 * @module utils/api
 */

import type { IncidentData, PredictionResponse, ActionCode } from '../types/dashboard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://walang-pasok-api.onrender.com';

/**
 * Custom error class for API-related failures.
 * 
 * @extends Error
 */
export class ApiError extends Error {
  /**
   * Create an API error.
   * 
   * @param message - Human-readable error description
   * @param status - HTTP status code (optional)
   */
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with timeout, error handling, and logging.
 * 
 * @template T - Expected response type
 * @param endpoint - API endpoint path (e.g., '/api/incidents')
 * @param options - Fetch options (method, headers, body, etc.)
 * @param timeoutMs - Request timeout in milliseconds (default: 60000)
 * @returns Promise resolving to typed response data
 * @throws {ApiError} On network failure, timeout, or non-2xx response
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit, timeoutMs: number = 60000): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`[API] ⚡ Fetching: ${endpoint}`, { url, method: options?.method || 'GET', timeout: `${timeoutMs}ms` });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`[API] ⏱️ TIMEOUT after ${timeoutMs}ms for ${endpoint}`);
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...options?.headers,
      },
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`[API] ✅ Response status: ${response.status} ${response.statusText}`);
    console.log(`[API] Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorDetails = `${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        console.error(`[API] ❌ Error response body:`, errorText);
        errorDetails += ` - ${errorText.substring(0, 200)}`;
      } catch (e) {
        console.error(`[API] ❌ Could not read error response body:`, e);
      }
      
      throw new ApiError(
        `API request failed: ${errorDetails}`,
        response.status
      );
    }

    const data = await response.json();
    console.log(`[API] ✅ Success response:`, data);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[API] ❌ FETCH FAILED for ${endpoint}:`, error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[API] ⏱️ Request aborted due to ${timeoutMs}ms timeout`);
      throw new ApiError(
        `Request timeout after ${timeoutMs / 1000} seconds. Backend may be in cold start (try again in 10 seconds).`,
        408
      );
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('[API] ❌ Possible CORS error or network failure');
      throw new ApiError(
        `Cannot connect to backend at ${API_BASE_URL}. This may be a CORS error or the server is offline.`
      );
    }
    
    console.error('[API] ❌ Unknown network error:', error);
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check API server health status.
 * 
 * @returns Promise resolving to health check response
 * @throws {ApiError} If health check fails
 */
export async function checkApiHealth(): Promise<{ status: string; message: string }> {
  return fetchApi('/api/health');
}

/**
 * Fetch all historical incident data from the backend.
 * 
 * Performs data validation and sanitization to ensure type safety.
 * Adds cache-busting timestamp to prevent stale data.
 * 
 * @returns Promise resolving to array of incident data objects
 * @throws {ApiError} If request fails or no valid incidents found
 */
export async function fetchIncidents(): Promise<IncidentData[]> {
  const timestamp = new Date().getTime();
  const response = await fetchApi<{ incidents: IncidentData[] }>(`/api/incidents?t=${timestamp}`);
  
  const rawIncidents = (response.incidents || []).filter((inc) => 
    inc && 
    inc.id && 
    inc.name
  );
  
  console.log(`[API] Received ${response.incidents?.length || 0} incidents from backend`);
  console.log(`[API] After basic validation: ${rawIncidents.length} incidents`);
  
  const sanitizedIncidents = rawIncidents.map((inc) => ({
    ...inc,
    actual_announcement_time: inc.actual_announcement_time != null 
      ? Number(inc.actual_announcement_time) 
      : null,
    actual_action_code: inc.actual_action_code != null 
      ? Number(inc.actual_action_code) 
      : null,
    hourly_timeline: inc.hourly_timeline || {},
    hourly_data: inc.hourly_data || undefined,
  }));
  
  console.log(`[API] Sanitized ${sanitizedIncidents.length} incidents with data coercion`);
  
  if (sanitizedIncidents.length === 0) {
    console.error('[API] No valid incidents found after filtering and sanitization');
  }
  
  return sanitizedIncidents as IncidentData[];
}

/**
 * Request payload for AI prediction endpoint.
 */
export interface PredictRequest {
  /** Current hour in 24-hour format (0-24, fractional for minutes) */
  current_hour: number;
  /** Whether flooding is currently active */
  flood_active: boolean;
  /** Whether PAGASA has issued a Red rainfall warning */
  pagasa_warning_red: boolean;
}

/**
 * Get AI-powered class suspension prediction.
 * 
 * Sends current weather conditions to the PPO model and receives
 * a suspension recommendation with probability distribution.
 * 
 * @param request - Current weather and time conditions
 * @returns Promise resolving to AI prediction response
 * @throws {ApiError} If prediction request fails
 */
export async function getPrediction(request: PredictRequest): Promise<PredictionResponse> {
  return fetchApi('/api/predict', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}