import "server-only";

import { createHmac } from "node:crypto";
import { createLogger } from "@/lib/logger";

const logger = createLogger("iam-events");

type IamEventLevel = "info" | "warn" | "error" | "fatal";

export type IamEvent = {
  event: string;
  status?: string;
  level?: IamEventLevel;
  method?: string;
  organization?: string;
  requestId?: string;
  sessionId?: string;
  message?: string;
  errorClass?: string;
  errorCode?: string | number;
  path?: string;
};

type IamEventConfig = {
  url: string;
  secret: string;
  timeoutMs: number;
};

export function getIamEventConfig(): IamEventConfig | undefined {
  const url = (process.env.SEMSITES_IAM_EVENT_URL ?? "").trim();
  const secret = (process.env.SEMSITES_IAM_EVENT_SECRET ?? "").trim();

  if (!url || !secret) {
    return undefined;
  }

  return {
    url,
    secret,
    timeoutMs: timeoutFromEnv(process.env.SEMSITES_IAM_EVENT_TIMEOUT_MS),
  };
}

export function reportIamEvent(event: IamEvent): void {
  const config = getIamEventConfig();
  if (!config) {
    return;
  }

  void sendIamEvent(event, config).catch((error) => {
    logger.warn("IAM event delivery failed", {
      event: normalizeKey(event.event, "auth_event"),
      status: normalizeKey(event.status, "unknown"),
      error: summarizeError(error),
    });
  });
}

export async function sendIamEvent(event: IamEvent, config = getIamEventConfig()): Promise<void> {
  if (!config) {
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify(normalizeIamEvent(event));
  const signature = createHmac("sha256", config.secret).update(`${timestamp}.${body}`).digest("hex");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Semsites-Iam-Timestamp": timestamp,
        "X-Semsites-Iam-Signature": `sha256=${signature}`,
      },
      body,
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`IAM event rejected with status ${response.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeIamEvent(event: IamEvent): Record<string, string | number> {
  const normalized: Record<string, string | number> = {
    source: "zitadel-login",
    event: normalizeKey(event.event, "auth_event"),
    status: normalizeKey(event.status, "attention"),
    level: event.level ?? "warn",
  };

  addIfPresent(normalized, "method", normalizeKey(event.method, ""));
  addIfPresent(normalized, "organization", cleanScalar(event.organization, 96));
  addIfPresent(normalized, "requestId", cleanScalar(event.requestId, 160));
  addIfPresent(normalized, "sessionId", cleanScalar(event.sessionId, 160));
  addIfPresent(normalized, "message", cleanMessage(event.message));
  addIfPresent(normalized, "error_class", normalizeKey(event.errorClass, ""));
  addIfPresent(normalized, "error_code", cleanScalar(event.errorCode, 80));
  addIfPresent(normalized, "path", cleanPath(event.path));

  return normalized;
}

export function summarizeError(error: unknown): Record<string, string> {
  if (error instanceof Error) {
    return {
      name: normalizeKey(error.name, "error"),
      message: cleanMessage(error.message, 120),
    };
  }

  return { name: "unknown", message: cleanMessage(String(error), 120) };
}

function addIfPresent(target: Record<string, string | number>, key: string, value: string | number): void {
  if (value !== "") {
    target[key] = value;
  }
}

function timeoutFromEnv(value: string | undefined): number {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1500;
  }

  return Math.min(Math.max(Math.round(parsed), 250), 5000);
}

function cleanScalar(value: unknown, maxLength: number): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    return "";
  }

  const text = stripControlCharacters(String(value)).trim().slice(0, maxLength);

  return text;
}

function cleanMessage(value: unknown, maxLength = 240): string {
  const text = cleanScalar(value, maxLength)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b(code|state|token|secret|password|otp|passkey|session|cookie|authorization)=([^&\s]+)/gi, "$1=[redacted]")
    .replace(/https?:\/\/[^\s"']+/gi, (url) => cleanPath(url) || "[url]")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function cleanPath(value: unknown): string {
  const text = cleanScalar(value, 240);
  if (!text) {
    return "";
  }

  let path: string;
  if (/^https?:\/\//i.test(text)) {
    try {
      path = new URL(text).pathname;
    } catch {
      return "";
    }
  } else {
    path = text.split("?")[0] ?? "";
  }

  return path.replace(/[^a-zA-Z0-9_./:@-]/g, "").slice(0, 160);
}

function stripControlCharacters(value: string): string {
  return Array.from(value)
    .map((char) => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? " " : char;
    })
    .join("");
}

function normalizeKey(value: unknown, fallback: string): string {
  const key = cleanScalar(value, 96)
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return key || fallback;
}
