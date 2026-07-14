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

import { useState, useCallback, useEffect } from "react";
import type { CSSProperties } from "react";
import {
  Card,
  CardTitle,
  CardBody,
  Title,
  Form,
  FormGroup,
  ActionGroup,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Flex,
  FlexItem,
  Radio,
  TextArea,
  Button,
  Alert,
  Content,
  EmptyState,
  EmptyStateBody,
  Skeleton,
  Stack,
  StackItem,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import { getErrorMessage } from "../utils/errorHandling";
import { useExecuteApi } from "../hooks/useExecuteApi";
import { useSubmittedFeedback } from "../hooks/useSubmittedFeedback";
import { FeedbackResourceService } from "../generated-client";
import type { Feedback, FeedbackResponse } from "../generated-client";
import FeedbackSubmittedFields from "./FeedbackSubmittedFields";
import {
  FEEDBACK_COMMENT_LABEL,
  FEEDBACK_DROPDOWN_FIELDS,
  FEEDBACK_RATING_LABEL,
} from "../utils/feedbackFormConfig";

const DROPDOWN_CONFIG = [
  {
    ...FEEDBACK_DROPDOWN_FIELDS[0],
    options: [
      "Very Accurate",
      "Mostly Accurate",
      "Somewhat Inaccurate",
      "Incorrect",
    ],
  },
  {
    ...FEEDBACK_DROPDOWN_FIELDS[1],
    options: ["Yes", "Mostly", "Somewhat", "No"],
  },
  {
    ...FEEDBACK_DROPDOWN_FIELDS[2],
    options: ["Yes", "Mostly", "Somewhat", "No"],
  },
];

const DROPDOWN_PLACEHOLDER = "Select an option";

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

/** Answer controls (dropdowns, radios, comment, actions) — half width per design; card stays full width. */
const FEEDBACK_FIELDS_WIDTH_STYLE: CSSProperties = {
  width: "50%",
  maxWidth: "100%",
};

type FeedbackFieldErrors = {
  accuracy: string | null;
  reasoning: string | null;
  checklist: string | null;
  rating: string | null;
};

const EMPTY_FIELD_ERRORS: FeedbackFieldErrors = {
  accuracy: null,
  reasoning: null,
  checklist: null,
  rating: null,
};

interface FeedbackFormProps {
  values: Record<string, string>;
  opens: Record<string, boolean>;
  setValue: (key: string, value: string) => void;
  setOpen: (key: string, open: boolean) => void;
  rating: number | null;
  setRating: (rating: number | null) => void;
  comment: string;
  setComment: (comment: string) => void;
  submitError: Error | null;
  fieldErrors: FeedbackFieldErrors;
  submitting: boolean;
  onSubmit: () => void;
}

function FeedbackForm({
  values,
  opens,
  setValue,
  setOpen,
  rating,
  setRating,
  comment,
  setComment,
  submitError,
  fieldErrors,
  submitting,
  onSubmit,
}: FeedbackFormProps) {
  return (
    <Form>
      {DROPDOWN_CONFIG.map(({ key, label, options }) => (
        <FormGroup key={key} label={label} fieldId={key} isRequired>
          <Dropdown
            isOpen={opens[key]}
            onSelect={() => setOpen(key, false)}
            onOpenChange={(open) => setOpen(key, open)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                onClick={() => setOpen(key, !opens[key])}
                isExpanded={opens[key]}
                style={{ width: "100%" }}
                status={fieldErrors[key] ? "danger" : undefined}
              >
                {values[key] || DROPDOWN_PLACEHOLDER}
              </MenuToggle>
            )}
          >
            <DropdownList>
              {options.map((opt) => (
                <DropdownItem
                  key={opt}
                  onClick={() => setValue(key, opt)}
                >
                  {opt}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
          {fieldErrors[key] && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant="error">{fieldErrors[key]}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
        </FormGroup>
      ))}

      <FormGroup
        label={FEEDBACK_RATING_LABEL}
        fieldId="rating"
        isRequired
      >
        <Flex spaceItems={{ default: "spaceItemsMd" }}>
          {RATING_VALUES.map((n) => (
            <FlexItem key={n}>
              <Radio
                id={`feedback-rating-${n}`}
                name="feedback-rating"
                isChecked={rating === n}
                onChange={() => setRating(n)}
                label={String(n)}
                isValid={!fieldErrors.rating}
              />
            </FlexItem>
          ))}
        </Flex>
        {fieldErrors.rating && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem variant="error">{fieldErrors.rating}</HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>

      <FormGroup
        label={FEEDBACK_COMMENT_LABEL}
        fieldId="comment"
      >
        <TextArea
          value={comment}
          onChange={(_e, val) => setComment(val ?? "")}
          id="feedback-comment"
          aria-label="Additional feedback"
        />
      </FormGroup>

      {submitError && (
        <Alert
          variant="danger"
          title="Failed to submit feedback"
          isInline
          className="pf-v6-u-mb-md"
        >
          {submitError.message}
        </Alert>
      )}

      <ActionGroup>
        <Button
          variant="primary"
          onClick={onSubmit}
          isDisabled={submitting}
          isLoading={submitting}
          aria-label="Submit Feedback"
        >
          Submit Feedback
        </Button>
      </ActionGroup>
    </Form>
  );
}

interface FeedbackReportCardProps {
  reportId: string;
}

export default function FeedbackReportCard({ reportId }: FeedbackReportCardProps) {
  const { feedback, loading: feedbackLoading, error: feedbackError, setFeedback } =
    useSubmittedFeedback(reportId);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [fieldErrors, setFieldErrors] =
    useState<FeedbackFieldErrors>(EMPTY_FIELD_ERRORS);
  const [values, setValues] = useState<Record<string, string>>({
    accuracy: "",
    reasoning: "",
    checklist: "",
  });
  const [opens, setOpens] = useState<Record<string, boolean>>({
    accuracy: false,
    reasoning: false,
    checklist: false,
  });

  const buildRequestBody = useCallback((): Feedback => ({
    rating: rating ?? 0,
    accuracy: values.accuracy ?? "",
    reasoning: values.reasoning ?? "",
    checklist: values.checklist ?? "",
    ...(comment.trim() ? { comment: comment.trim() } : {}),
  }), [rating, values, comment]);

  const { data: submitResult, loading: submitting, error: submitError, execute: submitFeedback } =
    useExecuteApi<FeedbackResponse>(() =>
      FeedbackResourceService.postApiV1ReportsFeedback({
        reportId,
        requestBody: buildRequestBody(),
      })
    );

  useEffect(() => {
    if (submitResult != null) {
      setFeedback(submitResult);
    }
  }, [submitResult, setFeedback]);

  const setOpen = (key: string, open: boolean) => {
    setOpens((o) => ({ ...o, [key]: open }));
  };
  const setValue = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setOpens((o) => ({ ...o, [key]: false }));
    if (key === "accuracy" || key === "reasoning" || key === "checklist") {
      setFieldErrors((e) => ({ ...e, [key]: null }));
    }
  };

  const handleRatingChange = (next: number | null) => {
    setRating(next);
    setFieldErrors((e) => ({ ...e, rating: null }));
  };

  const validateAndSubmitFeedback = () => {
    const next: FeedbackFieldErrors = { ...EMPTY_FIELD_ERRORS };
    let hasErrors = false;

    for (const d of DROPDOWN_CONFIG) {
      if (!(values[d.key] ?? "").trim()) {
        next[d.key] = "Required";
        hasErrors = true;
      }
    }
    if (rating === null) {
      next.rating = "Required";
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(next);
      return;
    }

    setFieldErrors(EMPTY_FIELD_ERRORS);
    submitFeedback();
  };

  const feedbackCardTitle = (
    <CardTitle>
      <Title headingLevel="h4" size="xl">
        Feedback
      </Title>
    </CardTitle>
  );

  if (feedbackLoading) {
    return (
      <Card>
        {feedbackCardTitle}
        <CardBody>
          <div style={FEEDBACK_FIELDS_WIDTH_STYLE}>
            <Stack hasGutter>
              <StackItem aria-hidden="true">
                <Skeleton
                  width="85%"
                  screenreaderText="Loading feedback card"
                />
              </StackItem>
              {Array.from({ length: 4 }).map((_, index) => (
                <StackItem key={index} aria-hidden="true">
                  <Skeleton
                    width={["100%", "100%", "100%", "70%"][index] ?? "50%"}
                    screenreaderText="Loading feedback card"
                  />
                </StackItem>
              ))}
            </Stack>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (feedbackError) {
    const errorStatus = (feedbackError as { status?: number })?.status;
    return (
      <Card>
        {feedbackCardTitle}
        <CardBody>
          <EmptyState
            headingLevel="h4"
            icon={ExclamationCircleIcon}
            titleText="Could not load feedback"
          >
            <EmptyStateBody>
              {errorStatus ? (
                <>
                  <p>
                    {errorStatus}: {getErrorMessage(feedbackError)}
                  </p>
                  Feedback for this report could not be retrieved.
                </>
              ) : (
                getErrorMessage(feedbackError)
              )}
            </EmptyStateBody>
          </EmptyState>
        </CardBody>
      </Card>
    );
  }

  if (feedback) {
    return (
      <Card>
        {feedbackCardTitle}
        <CardBody>
          <Content style={{ marginBottom: "var(--pf-t--global--spacer--xl)" }}>
            Thank you, we appreciate your feedback. Your feedback will be used to improve the
            accuracy of our AI models.
          </Content>
          <div style={FEEDBACK_FIELDS_WIDTH_STYLE}>
            <FeedbackSubmittedFields feedback={feedback} />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      {feedbackCardTitle}
      <CardBody>
        <Content style={{ marginBottom: "var(--pf-t--global--spacer--xl)" }}>
          Your feedback will be used to improve the accuracy of our AI models.
        </Content>
        <div style={FEEDBACK_FIELDS_WIDTH_STYLE}>
          <FeedbackForm
            values={values}
            opens={opens}
            setValue={setValue}
            setOpen={setOpen}
            rating={rating}
            setRating={handleRatingChange}
            comment={comment}
            setComment={setComment}
            submitError={submitError}
            fieldErrors={fieldErrors}
            submitting={submitting}
            onSubmit={validateAndSubmitFeedback}
          />
        </div>
      </CardBody>
    </Card>
  );
}
