// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useState, useEffect } from "react";
import { ApiError, FeedbackResourceService } from "../generated-client";
import type { FeedbackResponse } from "../generated-client";

export interface UseSubmittedFeedbackResult {
  feedback: FeedbackResponse | null;
  loading: boolean;
  error: Error | null;
  setFeedback: (feedback: FeedbackResponse | null) => void;
}

/** True when GET feedback returns 404 — user has not submitted yet. */
export function isFeedbackNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function useSubmittedFeedback(reportId: string): UseSubmittedFeedbackResult {
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    FeedbackResourceService.getApiV1ReportsFeedback({ reportId })
      .then((result) => {
        if (!cancelled) {
          setFeedback(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        if (isFeedbackNotFound(err)) {
          setFeedback(null);
          setLoading(false);
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  return { feedback, loading, error, setFeedback };
}
