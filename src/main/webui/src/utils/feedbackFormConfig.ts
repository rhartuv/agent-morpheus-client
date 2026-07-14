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

export const FEEDBACK_DROPDOWN_FIELDS = [
  {
    key: "accuracy" as const,
    label: "How accurate do you find ExploitIQ's assessment?",
  },
  {
    key: "reasoning" as const,
    label:
      "Is the reasoning and summary of findings clear, complete, and well-supported?",
  },
  {
    key: "checklist" as const,
    label: "Were the checklist questions and explanations easy to understand?",
  },
] as const;

export const FEEDBACK_RATING_LABEL =
  "Rate the response (1 = Poor, 5 = Excellent)";

export const FEEDBACK_COMMENT_LABEL =
  "Do you have any additional feedback or suggestions to improve the analysis?";
