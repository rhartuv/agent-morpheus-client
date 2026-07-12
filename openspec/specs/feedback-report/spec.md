# feedback-report Specification

## Purpose
Allow users to submit structured feedback on a repository report so that AI model accuracy can be improved. Feedback is collected via a card on the repository report page. The backend persists feedback in MongoDB and exposes REST endpoints for submit and retrieve.
## Requirements
### Requirement: Feedback Card Content
The Feedback card SHALL display the title "Feedback" and the subtitle "Your feedback will be used to improve the accuracy of our AI models." and SHALL be implemented as `FeedbackReportCard`.

#### Scenario: Card placement and labels
- **WHEN** a user views the repository report page with report data loaded and status "completed"
- **THEN** the Feedback card is shown after the Additional Details card with title "Feedback" and subtitle "Your feedback will be used to improve the accuracy of our AI models."

### Requirement: Feedback Form Fields
The card SHALL collect the following. Required fields SHALL be marked with an asterisk. The Submit Feedback button SHALL be disabled until all required fields are set, then enabled and primary.

- **Accuracy** (dropdown, required): “How accurate do you find the ExploitIQ's assessment? *” — options: Very Accurate, Mostly Accurate, Somewhat Inaccurate, Incorrect.
- **Reasoning** (dropdown, required): “Is the reasoning and summary of findings clear, complete, and well-supported? *” — options: Yes, Mostly, Somewhat, No.
- **Checklist** (dropdown, required): “Were the checklist questions and explanations easy to understand? *” — options: Yes, Mostly, Somewhat, No.
- **Rating** (1–5, required): “Rate the response (1 = Poor, 5 = Excellent): *”
- **Comment** (TextArea, optional): “Do you have any additional feedback or suggestions to improve the analysis?”

#### Scenario: Required fields and submit state
- **WHEN** a user views the Feedback card
- **THEN** the three dropdowns and the rating are shown as required; comment is optional
- **AND** Submit Feedback is disabled until all required fields are set, then enabled and primary

#### Scenario: Optional comment
- **WHEN** the user submits feedback
- **THEN** comment may be omitted; when provided, it is sent as `comment` in the payload

### Requirement: Frontend API Usage
The card SHALL use only the generated client: `FeedbackResourceService.postApiV1ReportsFeedback` for submit (e.g. via `useExecuteApi`) and `FeedbackResourceService.getApiV1ReportsFeedback` to load submitted feedback (e.g. via `useSubmittedFeedback`). The request body for submit SHALL conform to `Feedback` (rating, accuracy, reasoning, checklist, optional comment); `reportId` is taken from the URL path only. On load, a **404** from GET SHALL mean no feedback yet and the card SHALL show the editable form; a **200** SHALL show the read-only submitted view.

#### Scenario: Submit via generated client
- **WHEN** the user fills required fields and clicks "Submit Feedback"
- **THEN** the app calls `postApiV1ReportsFeedback` with the collected data and no direct fetch/axios

#### Scenario: Read-only submitted state after submit
- **WHEN** the user successfully submits feedback
- **THEN** the card uses the POST response to show the read-only view (no extra GET refetch)
- **AND** displays the submitted accuracy, reasoning, checklist, rating, and comment (if any) in a read-only layout matching the form field labels
- **AND** does not show the editable form

#### Scenario: Read-only submitted state on reload
- **WHEN** the card loads and `getApiV1ReportsFeedback` returns **200** for the report
- **THEN** the card displays the read-only submitted view instead of the feedback form

#### Scenario: Form shown when no prior feedback
- **WHEN** the card loads and `getApiV1ReportsFeedback` returns **404** for the report
- **THEN** the card displays the editable feedback form

### Requirement: Backend Feedback Processing
The backend SHALL expose REST endpoints for submitting and retrieving feedback for the authenticated user under `/api/v1/reports/{reportId}/feedback`. It SHALL persist feedback in MongoDB via `FeedbackRepositoryService` and SHALL NOT forward submissions to an external feedback service. The `userId` used for persistence and queries SHALL be derived from the authenticated session. Feedback SHALL be immutable after insert.

#### Scenario: Submit feedback flow
- **WHEN** the client sends POST to `/api/v1/reports/{reportId}/feedback` with a valid JSON body (rating, accuracy, reasoning, checklist, optional comment)
- **THEN** FeedbackResource receives the request and delegates to FeedbackService
- **AND** FeedbackService resolves the authenticated `userId` and persists the feedback via FeedbackRepositoryService
- **AND** on success the backend returns **200** with feedback fields and `submittedAt`
- **AND** on duplicate submission the backend returns 409 with an error message
- **AND** on unexpected persistence failure the backend returns 500 with an error message

#### Scenario: Retrieve feedback flow
- **WHEN** the client sends GET to `/api/v1/reports/{reportId}/feedback` for the authenticated user
- **THEN** FeedbackResource delegates to FeedbackService
- **AND** FeedbackService queries MongoDB for a document matching `reportId` and the authenticated `userId`
- **AND** when found the backend returns **200** with feedback fields and `submittedAt`
- **AND** when not found the backend returns **404**

#### Scenario: Backend error handling
- **WHEN** a feedback persistence or query operation fails unexpectedly
- **THEN** the backend logs the error and returns 500 with a JSON error payload
- **AND** the client receives a non-2xx response and may display an error message

### Requirement: Feedback Persistence

The backend SHALL persist user feedback in a MongoDB collection named `feedbacks`. Collection initialization SHALL follow the existing repository pattern: indexes are created at application startup via `@PostConstruct` using idempotent `createIndex` calls. A composite unique index on `report_id` and `user_id` SHALL enforce at most one feedback document per user per report.

#### Scenario: Collection and index initialization

- **WHEN** the application starts
- **THEN** `FeedbackRepositoryService` initializes the `feedbacks` collection indexes
- **AND** a composite unique index on `report_id` and `user_id` exists

#### Scenario: Persist feedback on submit

- **WHEN** an authenticated user submits valid feedback via `POST /api/v1/reports/{reportId}/feedback`
- **THEN** the backend stores a document in `feedbacks` with `report_id`, `user_id` (from the authenticated session, not the request body), `rating`, `accuracy`, `reasoning`, `checklist`, optional `comment`, and `submitted_at`
- **AND** the backend does not call an external feedback service

### Requirement: Feedback Immutability Policy

Users SHALL NOT be able to update or delete feedback after submission. The API SHALL expose insert and read operations only; no `PUT`, `PATCH`, or `DELETE` feedback endpoints SHALL be provided.

#### Scenario: Duplicate submission rejected

- **WHEN** an authenticated user submits feedback for a report for which they already have a `feedbacks` document
- **THEN** the backend returns **409 Conflict** with an error message indicating feedback was already submitted
- **AND** the existing document is unchanged

#### Scenario: No edit or delete endpoints

- **WHEN** a client attempts to update or delete an existing feedback record
- **THEN** no supported API endpoint exists for that operation

