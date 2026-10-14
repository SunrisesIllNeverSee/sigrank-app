// @vitest-environment node
/**
 * DNS pinning for Exchange outbound fetches (fix/exchange-dns-pinning): the
 * socket must dial only the addresses that passed SSRF validation — a
 * resolver that flips to a private address after the check (rebinding) must
 * never reach the connection.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "node:events";

const h = vi.hoisted(() => {
  const state = {
    requestCalls: [] as Array<{ url: unknown; options: Record<string, unknown> }>,
    responseStatus: 200,
    responseBody: "{}",
    responseHeaders: ["content-type", "application/json"] as string[],
    requestError: null as Error | null,
  };
  function makeRequest(url: unknown, options: unknown, cb?: unknown) {
    const onResponse = (typeof cb === "function" ? cb : typeof options === "function" ? options : () => {}) as (res: unknown) => void;
    state.requestCalls.push({ url, options: (options ?? {}) as Record<string, unknown> });
    const req = new EventEmitter() as EventEmitter & {
      write: (b: unknown) => void;
      end: () => void;
      destroy: (e?: Error) => void;
    };
    req.write = () => {};
    req.destroy = (e?: Error) => { if (e) queueMicrotask(() => req.emit("error", e)); };
    req.end = () => {
      if (state.requestError) {
        queueMicrotask(() => req.emit("error", state.requestError));
        return;
      }
      const res = new EventEmitter() as EventEmitter & {
        statusCode: number;
        statusMessage: string;
        rawHeaders: string[];
      };
      res.statusCode = state.responseStatus;
      res.statusMessage = "OK";
      res.rawHeaders = state.responseHeaders;
      onResponse(res);
      queueMicrotask(() => {
        res.emit("data", Buffer.from(state.responseBody));
        res.emit("end");
      });
    };
    return req;
  }
  return {
    state,
    httpsRequest: vi.fn(makeRequest),
    httpRequest: vi.fn(makeRequest),
  };
});

vi.mock("node:https", async (orig) => ({ ...(await orig() as object), request: h.httpsRequest }));
vi.mock("node:http", async (orig) => ({ ...(await orig() as object), request: h.httpRequest }));

import { pinnedExchangeFetch, pinnedLookup, resolveVerifiedAddresses } from "@/lib/exchange/ssrf";

type LookupFn = (
  hostname: string,
  options: { all?: boolean; family?: number } | undefined,
  cb: (err: Error | null, address?: unknown, family?: number) => void,
) => void;

const invokeLookup = (fn: unknown, all = false) =>
  new Promise<{ address?: unknown; family?: number }>((res, rej) => {
    (fn as LookupFn)("example.com", { all }, (err, address, family) => (err ? rej(err) : res({ address, family })));
  });

beforeEach(() => {
  h.state.requestCalls.length = 0;
  h.state.responseStatus = 200;
  h.state.responseBody = "{}";
  h.state.requestError = null;
  h.httpsRequest.mockClear();
  h.httpRequest.mockClear();
});

describe("resolveVerifiedAddresses", () => {
  it("returns the resolver's list when every address is public", async () => {
    const resolver = vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]);
    expect(await resolveVerifiedAddresses("example.com", resolver)).toEqual([{ address: "93.184.216.34", family: 4 }]);
  });

  it("returns null when ANY resolved address is private", async () => {
    const resolver = vi.fn(async () => [
      { address: "93.184.216.34", family: 4 },
      { address: "10.0.0.7", family: 4 },
    ]);
    expect(await resolveVerifiedAddresses("example.com", resolver)).toBeNull();
  });

  it("fails closed on resolver error, empty answers, and prohibited names", async () => {
    expect(await resolveVerifiedAddresses("example.com", async () => { throw new Error("ENOTFOUND"); })).toBeNull();
    expect(await resolveVerifiedAddresses("example.com", async () => [])).toBeNull();
    const never = vi.fn();
    expect(await resolveVerifiedAddresses("localhost", never)).toBeNull();
    expect(never).not.toHaveBeenCalled();
  });

  it("returns the literal for public IP hosts without resolving", async () => {
    const never = vi.fn();
    expect(await resolveVerifiedAddresses("93.184.216.34", never)).toEqual([{ address: "93.184.216.34", family: 4 }]);
    expect(never).not.toHaveBeenCalled();
  });
});

describe("pinnedLookup", () => {
  const addrs = [
    { address: "93.184.216.34", family: 4 },
    { address: "93.184.216.35", family: 4 },
  ];

  it("answers only from the validated list, rotating across calls", async () => {
    const fn = pinnedLookup(addrs);
    expect((await invokeLookup(fn)).address).toBe("93.184.216.34");
    expect((await invokeLookup(fn)).address).toBe("93.184.216.35");
    expect((await invokeLookup(fn)).address).toBe("93.184.216.34");
  });

  it("returns the full validated list when callers request all", async () => {
    const { address } = await invokeLookup(pinnedLookup(addrs), true);
    expect(address).toEqual(addrs);
  });
});

describe("pinnedExchangeFetch", () => {
  it("pins the connection to the validated address — a later rebind to private never reaches the socket", async () => {
    // Hostile resolver: first answer public; every subsequent answer private.
    // The connection must be built from the first (validated) answer only.
    const resolver = vi.fn()
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValue([{ address: "169.254.169.254", family: 4 }]);

    const res = await pinnedExchangeFetch("https://example.com/x", { resolver });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await res.text()).toBe("{}");

    expect(resolver).toHaveBeenCalledTimes(1);
    expect(h.httpsRequest).toHaveBeenCalledTimes(1);
    const { lookup } = h.state.requestCalls[0].options;
    expect(typeof lookup).toBe("function");
    // Whatever DNS would now say, the socket lookup answers only the verified IP.
    for (let i = 0; i < 3; i++) {
      expect((await invokeLookup(lookup)).address).toBe("93.184.216.34");
    }
    expect(resolver).toHaveBeenCalledTimes(1); // still one resolution total
  });

  it("rejects prohibited destinations before any request is made", async () => {
    await expect(pinnedExchangeFetch("https://169.254.169.254/latest/meta-data/")).rejects.toThrow(/prohibited/i);
    await expect(
      pinnedExchangeFetch("https://example.com/", { resolver: async () => [{ address: "127.0.0.1", family: 4 }] }),
    ).rejects.toThrow(/prohibited/i);
    expect(h.httpsRequest).not.toHaveBeenCalled();
    expect(h.httpRequest).not.toHaveBeenCalled();
  });

  it("rejects non-http(s) schemes", async () => {
    await expect(pinnedExchangeFetch("file:///etc/passwd")).rejects.toThrow(/scheme/i);
  });

  it("writes the request body and honors http:// targets", async () => {
    await pinnedExchangeFetch("http://example.com/hook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"a":1}',
      resolver: async () => [{ address: "93.184.216.34", family: 4 }],
    });
    expect(h.httpRequest).toHaveBeenCalledTimes(1);
    const { options } = h.state.requestCalls[0];
    expect(options.method).toBe("POST");
    expect(typeof options.lookup).toBe("function");
  });

  it("propagates connection failures", async () => {
    h.state.requestError = new Error("ECONNREFUSED");
    await expect(
      pinnedExchangeFetch("https://example.com/", { resolver: async () => [{ address: "93.184.216.34", family: 4 }] }),
    ).rejects.toThrow("ECONNREFUSED");
  });
});
