// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Configures the generated OpenAPI client for browser cookie/OIDC sessions.
 *
 * Quarkus treats requests with {@code X-Requested-With: XMLHttpRequest} as
 * JavaScript requests. With
 * {@code quarkus.oidc.authentication.java-script-auto-redirect=false}, expired
 * sessions return HTTP 499 instead of a 302 to the IdP (which fetch cannot
 * follow due to CORS — surfacing as TypeError "Failed to fetch").
 */

import { OpenAPI } from "../generated-client";

/** Header Quarkus OIDC uses to detect SPA/XHR requests (default checker). */
export const JS_REQUEST_HEADER = {
  "X-Requested-With": "XMLHttpRequest",
} as const;

export function configureApiClient(): void {
  OpenAPI.WITH_CREDENTIALS = true;
  OpenAPI.CREDENTIALS = "include";
  OpenAPI.HEADERS = {
    ...JS_REQUEST_HEADER,
  };
}
