import type { IncidentData, PredictionResponse, ActionCode } from '../types/dashboard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://walang-pasok-api.onrender.com';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Health check endpoint
export async function checkApiHealth(): Promise<{ status: string; message: string }> {
  return fetchApi('/api/health');
}

// Fetch all incidents
export async function fetchIncidents(): Promise<IncidentData[]> {
  const response = await fetchApi<{ incidents: IncidentData[] }>('/api/incidents');
  return response.incidents;
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