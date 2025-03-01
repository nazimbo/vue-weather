export interface OpenCageResult {
  annotations: Record<string, any>;
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  components: Record<string, any>;
  confidence: number;
  formatted: string;
  geometry: {
    lat: number;
    lng: number;
  };
}

export interface OpenCageResponse {
  documentation: string;
  licenses: Array<{ name: string; url: string }>;
  rate: {
    limit: number;
    remaining: number;
    reset: number;
  };
  results: OpenCageResult[];
  status: {
    code: number;
    message: string;
  };
  total_results: number;
}
