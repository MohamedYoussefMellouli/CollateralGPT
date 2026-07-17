"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { analyzeDispute } from "@/lib/api";
import type { DisputeInput, AnalysisResponse } from "@/types/dispute";

interface UseAnalyzeDisputeOptions {
  onSuccess?: (data: AnalysisResponse) => void;
  onError?: (error: Error) => void;
}

export function useAnalyzeDispute(options?: UseAnalyzeDisputeOptions) {
  return useMutation<AnalysisResponse, Error, DisputeInput>({
    mutationFn: analyzeDispute,
    retry: 1,
    onSuccess: (data) => {
      toast.success("Analysis complete", {
        description: `Predicted reason code: ${data.predicted_reason_code}`,
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error("Analysis failed", {
        description: error.message,
      });
      options?.onError?.(error);
    },
  });
}
