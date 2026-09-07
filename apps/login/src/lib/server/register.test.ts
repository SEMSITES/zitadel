import { Code, ConnectError } from "@zitadel/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { registerUser } from "./register";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock("@zitadel/client", () => ({
  Code: {
    NotFound: 5,
    PermissionDenied: 7,
  },
  ConnectError: class extends Error {
    code: number;

    constructor(message: string, code: number) {
      super(message);
      this.code = code;
    }
  },
  create: vi.fn((_schema: unknown, value: unknown) => value),
}));

vi.mock("@/lib/server/cookie", () => ({
  createSessionAndUpdateCookie: vi.fn(),
  createSessionForIdpAndUpdateCookie: vi.fn(),
}));

vi.mock("../zitadel", () => ({
  addHumanUser: vi.fn(),
  addIDPLink: vi.fn(),
  getLoginSettings: vi.fn(),
  getUserByID: vi.fn(),
  listAuthenticationMethodTypes: vi.fn(),
}));

vi.mock("../service-url", () => ({
  getServiceConfig: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock("../client", () => ({
  completeFlowOrGetUrl: vi.fn(),
}));

vi.mock("../fingerprint", () => ({
  getOrSetFingerprintId: vi.fn(),
}));

vi.mock("../logger", () => ({
  createLogger: vi.fn(() => ({ warn: vi.fn() })),
}));

vi.mock("../verify-helper", () => ({
  checkEmailVerification: vi.fn(),
  checkMFAFactors: vi.fn(),
}));

describe("registerUser", () => {
  let mockCreateSessionAndUpdateCookie: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    const { headers } = await import("next/headers");
    const { createSessionAndUpdateCookie } = await import("@/lib/server/cookie");
    const { addHumanUser, getLoginSettings, getUserByID } = await import("../zitadel");
    const { getServiceConfig } = await import("../service-url");
    const { checkEmailVerification } = await import("../verify-helper");

    vi.mocked(headers).mockResolvedValue(new Headers());
    vi.mocked(getServiceConfig).mockReturnValue({ serviceConfig: { baseUrl: "https://api.example.com" } });
    vi.mocked(getLoginSettings).mockResolvedValue({
      allowLocalAuthentication: true,
      allowRegister: true,
      passwordCheckLifetime: { seconds: 3600n, nanos: 0 },
    });
    vi.mocked(addHumanUser).mockResolvedValue({ userId: "user-1" });
    vi.mocked(getUserByID).mockResolvedValue({
      user: {
        type: {
          case: "human",
          value: {},
        },
      },
    });
    vi.mocked(checkEmailVerification).mockReturnValue({ redirect: "/verify" });

    mockCreateSessionAndUpdateCookie = vi.mocked(createSessionAndUpdateCookie);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("retries a transient NotFound while the new user projection catches up", async () => {
    const projectionLag = new ConnectError("user projection is not ready", Code.NotFound);
    mockCreateSessionAndUpdateCookie
      .mockRejectedValueOnce(projectionLag)
      .mockRejectedValueOnce(projectionLag)
      .mockResolvedValueOnce({
        session: {
          id: "session-1",
          factors: {
            user: {
              id: "user-1",
              loginName: "new-invitee@example.test",
              organizationId: "org-1",
            },
          },
        },
      });

    const resultPromise = registerUser({
      email: "new-invitee@example.test",
      firstName: "Design",
      lastName: "Blumenhof Barkmeyer",
      organization: "org-1",
      password: "test-password",
      requestId: "request-1",
    });

    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({ redirect: "/verify" });
    expect(mockCreateSessionAndUpdateCookie).toHaveBeenCalledTimes(3);
  });

  test("does not retry a non-NotFound authentication failure", async () => {
    const denied = new ConnectError("permission denied", Code.PermissionDenied);
    mockCreateSessionAndUpdateCookie.mockRejectedValue(denied);

    await expect(
      registerUser({
        email: "new-invitee@example.test",
        firstName: "Design",
        lastName: "Blumenhof Barkmeyer",
        organization: "org-1",
        password: "test-password",
        requestId: "request-1",
      }),
    ).rejects.toBe(denied);

    expect(mockCreateSessionAndUpdateCookie).toHaveBeenCalledTimes(1);
  });

  test("stops after three NotFound attempts", async () => {
    const projectionLag = new ConnectError("user projection is not ready", Code.NotFound);
    mockCreateSessionAndUpdateCookie.mockRejectedValue(projectionLag);

    const resultPromise = registerUser({
      email: "new-invitee@example.test",
      firstName: "Design",
      lastName: "Blumenhof Barkmeyer",
      organization: "org-1",
      password: "test-password",
      requestId: "request-1",
    });
    const rejection = expect(resultPromise).rejects.toBe(projectionLag);

    await vi.runAllTimersAsync();

    await rejection;
    expect(mockCreateSessionAndUpdateCookie).toHaveBeenCalledTimes(3);
  });
});
