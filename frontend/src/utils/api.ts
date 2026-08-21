import type { IncidentData, PredictionResponse, ActionCode } from '../types/dashboard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://walang-pasok-api.onrender.com';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit, timeoutMs: number = 60000): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`[API] ⚡ Fetching: ${endpoint}`, { url, method: options?.method || 'GET', timeout: `${timeoutMs}ms` });
  
  // Create AbortController for timeout handling
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
    
    // Handle timeout specifically
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
    
    // Check for CORS errors
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

// Health check endpoint
export async function checkApiHealth(): Promise<{ status: string; message: string }> {
  return fetchApi('/api/health');
}

// Fetch all incidents
export async function fetchIncidents(): Promise<IncidentData[]> {
  const timestamp = new Date().getTime();
  const response = await fetchApi<{ incidents: IncidentData[] }>(`/api/incidents?t=${timestamp}`);
  
  // Relaxed filter: Only check for essential fields, not strict types
  const rawIncidents = (response.incidents || []).filter((inc) => 
    inc && 
    inc.id && 
    inc.name
  );
  
  console.log(`[API] Received ${response.incidents?.length || 0} incidents from backend`);
  console.log(`[API] After basic validation: ${rawIncidents.length} incidents`);
  
  // Sanitize and coerce data (hydration phase)
  const sanitizedIncidents = rawIncidents.map((inc) => ({
    ...inc,
    // Coerce string-numbers to actual numbers, fallback to null
    actual_announcement_time: inc.actual_announcement_time != null 
      ? Number(inc.actual_announcement_time) 
      : null,
    actual_action_code: inc.actual_action_code != null 
      ? Number(inc.actual_action_code) 
      : null,
    // Ensure hourly_timeline exists (empty object if missing)
    hourly_timeline: inc.hourly_timeline || {},
  }));
  
  console.log(`[API] Sanitized ${sanitizedIncidents.length} incidents with data coercion`);
  
  if (sanitizedIncidents.length === 0) {
    console.error('[API] No valid incidents found after filtering and sanitization');
  }
  
  return sanitizedIncidents as IncidentData[];
}

// Get AI prediction
export interface PredictRequest {
  current_hour: number;
  flood_active: boolean;
  pagasa_warning_red: boolean;
}

export async function getPrediction(request: PredictRequest): Promise<PredictionResponse> {
  return fetchApi('/api/predict', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}