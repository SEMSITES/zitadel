"use server";

import { headers } from "next/headers";
import { isSafeRedirectUri } from "./client-utils";
import { completeAuthFlow } from "./server/auth-flow";
import { getPublicHostWithProtocol } from "./server/host";

type FinishFlowCommand =
  | {
      sessionId: string;
      requestId: string;
    }
  | { loginName: string };

function goToSignedInPage(
  props:
    | { sessionId: string; organization?: string; requestId?: string }
    | { organization?: string; loginName: string; requestId?: string },
) {
  const params = new URLSearchParams({});

  if ("loginName" in props && props.loginName) {
    params.append("loginName", props.loginName);
  }

  if ("sessionId" in props && props.sessionId) {
    params.append("sessionId", props.sessionId);
  }

  if (props.organization) {
    params.append("organization", props.organization);
  }

  // required to show conditional UI for device flow
  if (props.requestId) {
    params.append("requestId", props.requestId);
  }

  return `/signedin?` + params;
}

/**
 * Complete authentication flow or get next URL for navigation
 * - For OIDC/SAML flows with sessionId+requestId: completes flow directly via server action
 * - For device flows: returns URL to signed-in page
 * - For other cases: returns default redirect or fallback URL
 */
export async function completeFlowOrGetUrl(
  command: FinishFlowCommand & { organization?: string },
  defaultRedirectUri?: string,
): Promise<{ redirect: string } | { error: string } | { samlData: { url: string; fields: Record<string, string> } }> {
  // Complete OIDC/SAML flows directly with server action
  if (
    "sessionId" in command &&
    "requestId" in command &&
    (command.requestId.startsWith("saml_") || command.requestId.startsWith("oidc_"))
  ) {
    // This completes the flow and returns a redirect URL or error
    return completeAuthFlow({
      sessionId: command.sessionId,
      requestId: command.requestId,
    });
  }

  // For all other cases, return URL for navigation
  const url = await getNextUrl(command, defaultRedirectUri);
  return { redirect: url };
}

/**
 * for client: redirects user back to device flow completion, default redirect, or success page
 * Note: OIDC/SAML flows now use completeAuthFlowAction() instead of URL navigation
 * @param command
 * @returns
 */
export async function getNextUrl(
  command: FinishFlowCommand & { organization?: string },
  defaultRedirectUri?: string,
): Promise<string> {
  // finish Device Authorization Flow
  if (
    "requestId" in command &&
    command.requestId.startsWith("device_") &&
    ("loginName" in command || "sessionId" in command)
  ) {
    const result = goToSignedInPage({
      ...command,
      organization: command.organization,
    });
    return result;
  }

  // OIDC/SAML flows are now handled by completeAuthFlowAction() server action
  // This function only handles device flows and fallback navigation

  return resolveRedirectUri(command, defaultRedirectUri);
}

/**
 * Resolves the redirect URI based on the following priority:
 * 1. DEFAULT_REDIRECT_URI environment variable
 * 2. defaultRedirectUri from organization settings
 * 3. Relative signed-in page fallback
 * 4. Reserved for future extensions
 */
export async function resolveRedirectUri(command: FinishFlowCommand, defaultRedirectUri?: string): Promise<string> {
  // 1. Environment variable override
  const envOverride = process.env.DEFAULT_REDIRECT_URI;
  if (envOverride) {
    if (envOverride.startsWith("/")) {
      // Special state: trigger absolute host-based redirect with provided path
      try {
        const _headers = await headers();
        const host = getPublicHostWithProtocol(_headers);
        const result = `${host}${envOverride}`;
        return result;
      } catch {
        // Fall back to the relative signed-in page if the public host cannot be resolved.
      }
    } else {
      return envOverride;
    }
  }

  // 2. Default redirect URI from settings
  if (defaultRedirectUri) {
    if (isSafeRedirectUri(defaultRedirectUri)) {
      return defaultRedirectUri;
    }
  }

  // 3. Default signed-in page (relative)
  return goToSignedInPage(command);
}
