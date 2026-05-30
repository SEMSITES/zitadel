"use server";

import { getAllSessions } from "@/lib/cookies";
import { createLogger } from "@/lib/logger";
import { loginWithOIDCAndSession } from "@/lib/oidc";
import { loginWithSAMLAndSession } from "@/lib/saml";
import { getServiceConfig } from "@/lib/service-url";
import { listSessions, ServiceConfig } from "@/lib/zitadel";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { headers } from "next/headers";
import { reportIamEvent } from "./iam-events";

const logger = createLogger("auth-flow");

export interface AuthFlowParams {
  sessionId: string;
  requestId: string;
  organization?: string;
}

async function loadSessions({ serviceConfig, ids }: { serviceConfig: ServiceConfig; ids: string[] }): Promise<Session[]> {
  const response = await listSessions({ serviceConfig, ids: ids.filter((id: string | undefined) => !!id) });

  return response?.sessions ?? [];
}

/**
 * Server Action to complete authentication flow
 * Complete OIDC/SAML authentication flow with session
 * This is the shared logic for flow completion
 * Returns either an error or a redirect URL for client-side navigation
 */
export async function completeAuthFlow(
  command: AuthFlowParams,
): Promise<{ error: string } | { redirect: string } | { samlData: { url: string; fields: Record<string, string> } }> {
  const { sessionId, requestId } = command;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  const sessionCookies = await getAllSessions();
  const ids = sessionCookies.map((s) => s.id);
  let sessions: Session[] = [];

  if (ids && ids.length) {
    sessions = await loadSessions({ serviceConfig, ids });
  }

  if (requestId.startsWith("oidc_")) {
    // Complete OIDC flow
    const result = await loginWithOIDCAndSession({
      serviceConfig,
      authRequest: requestId.replace("oidc_", ""),
      sessionId,
      sessions,
      sessionCookies,
    });

    // Safety net - ensure we always return a valid object
    if (!result || typeof result !== "object" || (!("redirect" in result) && !("error" in result))) {
      logger.error("Auth flow: Invalid result from loginWithOIDCAndSession:", { result });
      reportIamEvent({
        event: "auth_flow_invalid_result",
        level: "error",
        status: "invalid_result",
        method: "oidc",
        requestId,
        sessionId,
        organization: command.organization,
      });
      return { error: "Authentication completed but navigation failed" };
    }

    if ("error" in result) {
      reportIamEvent({
        event: "auth_flow_failed",
        level: "error",
        status: "flow_error",
        method: "oidc",
        requestId,
        sessionId,
        organization: command.organization,
        message: result.error,
      });
    }

    return result;
  } else if (requestId.startsWith("saml_")) {
    // Complete SAML flow
    const result = await loginWithSAMLAndSession({
      serviceConfig,
      samlRequest: requestId.replace("saml_", ""),
      sessionId,
      sessions,
      sessionCookies,
    });

    // Safety net - ensure we always return a valid object
    if (
      !result ||
      typeof result !== "object" ||
      (!("redirect" in result) && !("error" in result) && !("samlData" in result))
    ) {
      logger.error("Auth flow: Invalid result from loginWithSAMLAndSession:", { result });
      reportIamEvent({
        event: "auth_flow_invalid_result",
        level: "error",
        status: "invalid_result",
        method: "saml",
        requestId,
        sessionId,
        organization: command.organization,
      });
      return { error: "Authentication completed but navigation failed" };
    }

    if ("error" in result) {
      reportIamEvent({
        event: "auth_flow_failed",
        level: "error",
        status: "flow_error",
        method: "saml",
        requestId,
        sessionId,
        organization: command.organization,
        message: result.error,
      });
    }

    return result;
  }

  reportIamEvent({
    event: "auth_flow_failed",
    level: "warn",
    status: "invalid_request_id",
    requestId,
    sessionId,
    organization: command.organization,
  });
  return { error: "Invalid request ID format" };
}
