export const handler = async (event) => {
  if (!event || typeof event !== "object") {
    return {
      ok: false,
      error: "event must be an object"
    };
  }

  /*
   * REQUEST PHASE
   *
   * Framework invokes Lambda as:
   *
   * {
   *   action: "notify",
   *   payload: {
   *     schemaVersion: 1,
   *     gateDigest: "...",
   *     timeoutSeconds: 30,
   *     context: {...},
   *     findings: [...]
   *   }
   * }
   */
  if (event.action === "notify") {
    const payload = event.payload;

    if (!payload || typeof payload !== "object") {
      return {
        ok: false,
        error: "notify payload is missing"
      };
    }

    if (
      typeof payload.gateDigest !== "string" ||
      !/^[0-9a-f]{64}$/.test(payload.gateDigest)
    ) {
      return {
        ok: false,
        error: "gateDigest is missing or invalid"
      };
    }

    /*
     * Synthetic broker is deliberately stateless.
     *
     * Encode the gate digest into the request ID so the later status request
     * can reconstruct the exact gate binding without DynamoDB.
     *
     * This is TEST INFRASTRUCTURE ONLY.
     */
    const requestId = `synthetic-${payload.gateDigest}`;

    const createdAt = new Date().toISOString();
    const timeoutSeconds =
      Number.isInteger(payload.timeoutSeconds) &&
      payload.timeoutSeconds > 0
        ? payload.timeoutSeconds
        : 900;

    const expiresAt = new Date(
      Date.now() + timeoutSeconds * 1000
    ).toISOString();

    console.log(
      JSON.stringify({
        event: "synthetic-break-glass-notify",
        requestId,
        gateDigest: payload.gateDigest,
        repository: payload.context?.repository ?? null,
        commitSha: payload.context?.commitSha ?? null,
        findingCount: Array.isArray(payload.findings)
          ? payload.findings.length
          : 0
      })
    );

    return {
      ok: true,
      body: {
        requestId,
        gateDigest: payload.gateDigest,
        status: "pending",
        createdAt,
        expiresAt
      }
    };
  }

  /*
   * STATUS PHASE
   *
   * Framework invokes Lambda as:
   *
   * {
   *   action: "status",
   *   requestId: "synthetic-<gateDigest>"
   * }
   *
   * For this first positive-path test we deterministically APPROVE.
   */
  if (event.action === "status") {
    const requestId = event.requestId;

    if (
      typeof requestId !== "string" ||
      !requestId.startsWith("synthetic-")
    ) {
      return {
        ok: false,
        error: "synthetic requestId is missing or invalid"
      };
    }

    const gateDigest = requestId.slice("synthetic-".length);

    if (!/^[0-9a-f]{64}$/.test(gateDigest)) {
      return {
        ok: false,
        error: "requestId does not contain a valid gate digest"
      };
    }

    console.log(
      JSON.stringify({
        event: "synthetic-break-glass-status",
        requestId,
        gateDigest,
        decision: "approved"
      })
    );

    return {
      ok: true,
      body: {
        requestId,
        gateDigest,
        status: "pending"
      }
    };
  }

  return {
    ok: false,
    error: `unsupported action: ${String(event.action)}`
  };
};
