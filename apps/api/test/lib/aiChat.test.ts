import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { APICallError } from "ai";
import {
  chatStepSafetyLimit,
  describeChatError,
  filterUnsupportedFileParts,
  localePromptBlock,
  modelFileDataToBase64,
  runBatch,
} from "../../src/services/aiChat.service.js";
import { AppError } from "../../src/utils/errors.js";
import { AI_CHAT_MAX_MESSAGES, aiChatBodySchema } from "../../src/validators/ai.validators.js";

const msg = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i),
    role: "user",
    parts: [{ type: "text", text: "hi" }],
  }));

describe("describeChatError", () => {
  it("passes AppError messages through", () => {
    assert.equal(describeChatError(AppError.forbidden("No AI access")), "No AI access");
  });

  it("never leaks provider internals", () => {
    const err = new APICallError({
      message: "secret sk-123 at https://internal.example/v1",
      url: "https://internal.example/v1",
      requestBodyValues: { key: "sk-123" },
      statusCode: 401,
    });
    const text = describeChatError(err);
    assert.ok(!text.includes("sk-123"));
    assert.ok(!text.includes("internal.example"));
    assert.match(text, /API key/i);
  });

  it("maps rate limits and unknown errors", () => {
    const limited = new APICallError({
      message: "x",
      url: "u",
      requestBodyValues: {},
      statusCode: 429,
    });
    assert.match(describeChatError(limited), /rate-limiting/i);
    assert.match(describeChatError(new Error("boom")), /went wrong/i);
  });
});

describe("localePromptBlock", () => {
  it("names the language for known locales only", () => {
    assert.match(localePromptBlock("pt"), /Portuguese/);
    assert.match(localePromptBlock("es"), /Spanish/);
    assert.equal(localePromptBlock("xx"), "");
    assert.equal(localePromptBlock(undefined), "");
  });
});

describe("aiChatBodySchema", () => {
  it("accepts a locale and rejects unknown ones", () => {
    assert.ok(aiChatBodySchema.safeParse({ messages: msg(1), locale: "pt" }).success);
    assert.ok(!aiChatBodySchema.safeParse({ messages: msg(1), locale: "fr" }).success);
  });

  it("caps history length and size", () => {
    assert.ok(!aiChatBodySchema.safeParse({ messages: msg(AI_CHAT_MAX_MESSAGES + 1) }).success);
    const huge = [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "x".repeat(1_600_000) }],
      },
    ];
    assert.ok(!aiChatBodySchema.safeParse({ messages: huge }).success);
  });
});

describe("runBatch", () => {
  it("runs sequentially and isolates per-item failures", async () => {
    const order: number[] = [];
    const out = await runBatch([1, 2, 3], async (n) => {
      order.push(n);
      if (n === 2) throw AppError.badRequest("bad item");
      return { value: n * 10 };
    });
    assert.deepEqual(order, [1, 2, 3]);
    assert.equal(out.total, 3);
    assert.equal(out.succeeded, 2);
    assert.equal(out.failed, 1);
    assert.equal(out.results[0].ok, true);
    assert.equal(out.results[0].value, 10);
    assert.equal(out.results[1].ok, false);
    assert.equal(out.results[1].index, 1);
    assert.equal(out.results[2].value, 30);
  });
});

describe("chat step budget", () => {
  it("leaves room for the final answer after the tool budget", () => {
    assert.ok(chatStepSafetyLimit(12) > 12);
  });
});

describe("modelFileDataToBase64", () => {
  it("strips data-URL prefixes and normalizes binary data", () => {
    assert.equal(modelFileDataToBase64("data:image/png;base64,abc"), "abc");
    assert.equal(modelFileDataToBase64("plainbase64"), "plainbase64");
    assert.equal(modelFileDataToBase64(Buffer.from("hi")), "aGk=");
    assert.equal(modelFileDataToBase64(new Uint8Array([104, 105])), "aGk=");
    assert.equal(modelFileDataToBase64({ type: "data", data: Buffer.from("hi") }), "aGk=");
    assert.equal(
      modelFileDataToBase64({ type: "url", url: "data:image/jpeg;base64,zz" }),
      "zz",
    );
    assert.equal(modelFileDataToBase64({ type: "url", url: "https://example.com/x.png" }), null);
    assert.equal(modelFileDataToBase64(null), null);
  });
});

describe("filterUnsupportedFileParts", () => {
  const sampleMessages = [
    {
      id: "u1",
      role: "user" as const,
      parts: [
        { type: "text" as const, text: "Add this song" },
        {
          type: "file" as const,
          url: "data:application/pdf;base64,JVBERi0x...",
          mediaType: "application/pdf",
          filename: "sheet.pdf",
        },
        {
          type: "file" as const,
          url: "data:image/jpeg;base64,/9j/4AAQ...",
          mediaType: "image/jpeg",
          filename: "sheet.jpg",
        },
      ],
    },
  ];

  it("converts unsupported PDF and image parts to text for DeepSeek", () => {
    const out = filterUnsupportedFileParts(sampleMessages, "deepseek");
    assert.equal(out[0].parts.length, 3);
    assert.equal(out[0].parts[0].type, "text");
    assert.equal(out[0].parts[1].type, "text");
    assert.match((out[0].parts[1] as { text: string }).text, /Attached PDF: sheet\.pdf/);
    assert.equal(out[0].parts[2].type, "text");
    assert.match((out[0].parts[2] as { text: string }).text, /Attached image: sheet\.jpg/);
  });

  it("converts unsupported PDF to text but preserves images for OpenAI", () => {
    const out = filterUnsupportedFileParts(sampleMessages, "openai");
    assert.equal(out[0].parts[0].type, "text");
    assert.equal(out[0].parts[1].type, "text");
    assert.match((out[0].parts[1] as { text: string }).text, /Attached PDF: sheet\.pdf/);
    assert.equal(out[0].parts[2].type, "file");
  });

  it("preserves native PDF and image parts for Google and Anthropic", () => {
    const googleOut = filterUnsupportedFileParts(sampleMessages, "google");
    assert.equal(googleOut[0].parts[1].type, "file");
    assert.equal(googleOut[0].parts[2].type, "file");

    const anthropicOut = filterUnsupportedFileParts(sampleMessages, "anthropic");
    assert.equal(anthropicOut[0].parts[1].type, "file");
    assert.equal(anthropicOut[0].parts[2].type, "file");
  });
});
