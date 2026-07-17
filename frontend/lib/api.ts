import axios from "axios";
import type { DisputeInput, AnalysisResponse } from "@/types/dispute";

// ─── Axios Instance ──────────────────────────────────────────────────────────

export const apiClient = axios.create({
  // Direct connection to backend (client-side)
  baseURL: "http://127.0.0.1:8001",
  timeout: 300_000, // 5 minutes — LLM inference can be very slow
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Request Interceptor — attach auth / tracing headers if needed ──────────

apiClient.interceptors.request.use(
  (config) => {
    // Extend here: e.g. attach JWT from localStorage
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — normalize errors ─────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.detail ??
      error?.message ??
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * POST /api/analyze-dispute
 * Submits dispute details to the AI analysis engine.
 */
export async function analyzeDispute(
  input: DisputeInput
): Promise<AnalysisResponse> {
  const { data } = await apiClient.post<AnalysisResponse>(
    "/api/analyze-dispute",
    input
  );
  return data;
}
