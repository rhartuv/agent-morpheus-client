// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../generated-client";
import type { ApiRequestOptions } from "../generated-client/core/ApiRequestOptions";
import {
  isUnauthorizedError,
  redirectToLogin,
  redirectToLoginIfUnauthorized,
  resetUnauthorizedRedirectState,
} from "./errorHandling";

function apiError(status: number): ApiError {
  const request = { method: "GET", url: "/api/v1/example" } as ApiRequestOptions;
  return new ApiError(
    request,
    {
      url: "/api/v1/example",
      ok: false,
      status,
      statusText: status === 401 ? "Unauthorized" : "Client Closed Request",
      body: undefined,
    },
    status === 401 ? "Unauthorized" : "Client Closed Request"
  );
}

function stubBrowserGlobals(reloadMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal("window", { location: { reload: reloadMock } });
  vi.stubGlobal("sessionStorage", { clear: vi.fn() });
}

describe("isUnauthorizedError", () => {
  it("returns true for ApiError with status 401", () => {
    expect(isUnauthorizedError(apiError(401))).toBe(true);
  });

  it("returns true for ApiError with status 499", () => {
    expect(isUnauthorizedError(apiError(499))).toBe(true);
  });

  it("returns false for ApiError with other statuses", () => {
    expect(isUnauthorizedError(apiError(403))).toBe(false);
    expect(isUnauthorizedError(apiError(500))).toBe(false);
  });

  it("returns true for HTTP 401/499 message errors", () => {
    expect(isUnauthorizedError(new Error("HTTP 401: Unauthorized"))).toBe(true);
    expect(isUnauthorizedError(new Error("HTTP 499: Client Closed Request"))).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isUnauthorizedError(new Error("Failed to fetch"))).toBe(false);
    expect(isUnauthorizedError(new Error("HTTP 400: Bad Request"))).toBe(false);
    expect(isUnauthorizedError("not an error")).toBe(false);
    expect(isUnauthorizedError(null)).toBe(false);
  });
});

describe("redirectToLogin", () => {
  let reloadMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetUnauthorizedRedirectState();
    reloadMock = vi.fn();
    stubBrowserGlobals(reloadMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetUnauthorizedRedirectState();
  });

  it("clears sessionStorage and reloads the page", () => {
    redirectToLogin();
    expect(sessionStorage.clear).toHaveBeenCalledTimes(1);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("only clears storage and reloads once when called repeatedly", () => {
    redirectToLogin();
    redirectToLogin();
    expect(sessionStorage.clear).toHaveBeenCalledTimes(1);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});

describe("redirectToLoginIfUnauthorized", () => {
  let reloadMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetUnauthorizedRedirectState();
    reloadMock = vi.fn();
    stubBrowserGlobals(reloadMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetUnauthorizedRedirectState();
  });

  it("redirects and returns true for unauthorized ApiError", () => {
    expect(redirectToLoginIfUnauthorized(apiError(401))).toBe(true);
    expect(sessionStorage.clear).toHaveBeenCalledTimes(1);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("redirects and returns true for 499 ApiError", () => {
    expect(redirectToLoginIfUnauthorized(apiError(499))).toBe(true);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("returns false and does not reload for other errors", () => {
    expect(redirectToLoginIfUnauthorized(new Error("Failed to fetch"))).toBe(false);
    expect(redirectToLoginIfUnauthorized(apiError(403))).toBe(false);
    expect(sessionStorage.clear).not.toHaveBeenCalled();
    expect(reloadMock).not.toHaveBeenCalled();
  });
});
