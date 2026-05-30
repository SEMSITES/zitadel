import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { normalizeIamEvent, sendIamEvent, summarizeError } from "./iam-events";

describe("iam events", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("normalizes sensitive values before sending", () => {
    const event = normalizeIamEvent({
      event: "Callback Failed",
      status: "flow error",
      level: "error",
      method: "OIDC",
      organization: "370457874469552131",
      requestId: "oidc_V2_123",
      sessionId: "raw-session",
      message:
        "Failed for alex@semsites.de code=abc&state=xyz token=secret redirect=https://app.semsites.io/auth/callback?code=abc",
      path: "https://app.semsites.io/auth/callback?code=abc",
    });

    expect(event).toMatchObject({
      source: "zitadel-login",
      event: "callback_failed",
      status: "flow_error",
      level: "error",
      method: "oidc",
      organization: "370457874469552131",
      requestId: "oidc_V2_123",
      sessionId: "raw-session",
      path: "/auth/callback",
    });
    expect(String(event.message)).not.toContain("alex@semsites.de");
    expect(String(event.message)).not.toContain("code=abc");
    expect(String(event.message)).not.toContain("state=xyz");
    expect(String(event.message)).not.toContain("token=secret");
    expect(String(event.message)).not.toContain("https://app.semsites.io");
  });

  test("signs request with timestamp and body", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T10:00:00Z"));

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202 });
    vi.stubGlobal("fetch", fetchMock);

    await sendIamEvent(
      { event: "auth_failure", status: "flow_error", method: "password" },
      { url: "https://webhooks.semsites.io/_service/iam-events.php", secret: "test-secret", timeoutMs: 1000 },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const body = init.body as string;
    const timestamp = "1780221600";
    const signature = createHmac("sha256", "test-secret").update(`${timestamp}.${body}`).digest("hex");

    expect(init.headers["X-Semsites-Iam-Timestamp"]).toBe(timestamp);
    expect(init.headers["X-Semsites-Iam-Signature"]).toBe(`sha256=${signature}`);
    expect(JSON.parse(body)).toMatchObject({
      source: "zitadel-login",
      event: "auth_failure",
      status: "flow_error",
      method: "password",
    });
  });

  test("summarizes thrown errors without raw urls", () => {
    const summary = summarizeError(new Error("Failed url=https://app.semsites.io/auth/callback?code=abc"));

    expect(summary.name).toBe("error");
    expect(summary.message).toContain("/auth/callback");
    expect(summary.message).not.toContain("code=abc");
  });
});
