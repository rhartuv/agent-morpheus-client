/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Feedback } from '../models/Feedback';
import type { FeedbackResponse } from '../models/FeedbackResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FeedbackResourceService {
    /**
     * Get submitted feedback for a report
     * Returns the authenticated user's submitted feedback for the given report, or 404 if none
     * @returns FeedbackResponse Feedback retrieved successfully
     * @throws ApiError
     */
    public static getApiV1ReportsFeedback({
        reportId,
    }: {
        /**
         * Report identifier
         */
        reportId: string,
    }): CancelablePromise<FeedbackResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reports/{reportId}/feedback',
            path: {
                'reportId': reportId,
            },
            errors: {
                404: `No feedback found for this report`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Submit user feedback for a report
     * Submits user feedback for the given report and persists it in MongoDB
     * @returns FeedbackResponse Feedback successfully created
     * @throws ApiError
     */
    public static postApiV1ReportsFeedback({
        reportId,
        requestBody,
    }: {
        /**
         * Report identifier
         */
        reportId: string,
        /**
         * User feedback data
         */
        requestBody: Feedback,
    }): CancelablePromise<FeedbackResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/reports/{reportId}/feedback',
            path: {
                'reportId': reportId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Report not found`,
                409: `Feedback already submitted for this report`,
                500: `Internal server error`,
            },
        });
    }
}
