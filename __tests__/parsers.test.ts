import { describe, expect, it } from "@jest/globals";
import {
  parseFollowUpSuggestions,
  parseGPTStreamedData,
} from "../lib/parsers/parsers";

describe("Parse GPT Streaming output", () => {
  it("First streamed response", () => {
    const testStr = `data: {"id":"chatcmpl-7W2geutswow6tPpTjHSJZMDcKFoAY","object":"chat.completion.chunk","created":1687871180,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}

data: {"id":"chatcmpl-7W2geutswow6tPpTjHSJZMDcKFoAY","object":"chat.completion.chunk","created":1687871180,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}


`;
    const output = parseGPTStreamedData(testStr);
    expect(output).toStrictEqual({
      completeChunks: ["Hello"],
      done: false,
      incompleteChunk: null,
    });
  });
  it("Exclamation mark", () => {
    const exStr = `data: {"id":"chatcmpl-7W2geutswow6tPpTjHSJZMDcKFoAY","object":"chat.completion.chunk","created":1687871180,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

`;
    const output = parseGPTStreamedData(exStr);
    expect(output).toStrictEqual({
      completeChunks: ["!"],
      done: false,
      incompleteChunk: null,
    });
  });
  it("Done", () => {
    const exStr = `data: [DONE]`;
    const output = parseGPTStreamedData(exStr);
    expect(output).toStrictEqual({
      completeChunks: [],
      done: true,
      incompleteChunk: null,
    });
  });
  it("Done in 2nd chunk", () => {
    const exStr = `data: {"id":"chatcmpl-7W2geutswow6tPpTjHSJZMDcKFoAY","object":"chat.completion.chunk","created":1687871180,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{"content":"."},"finish_reason":null}]}

data: [DONE]`;
    const output = parseGPTStreamedData(exStr);
    expect(output).toStrictEqual({
      completeChunks: ["."],
      done: true,
      incompleteChunk: null,
    });
  });
  it("two complete chunks, 1 incomplete chunk", () => {
    const exStr = `
    data: {"id":"chatcmpl-7W2geutswow6tPpTjHSJZMDcKFoAY","object":"chat.completion.chunk","created":1687871180,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{"content":"yee hawww"},"finish_reason":null}]}
    data: {"id":"chatcmpl-7W2geutswow6tPpTjHSJZMDcKFoAY","object":"chat.completion.chunk","created":1687871180,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"delta":{"content":"cowboy"},"finish_reason":null}]}
data: {"id": 123`;
    const output = parseGPTStreamedData(exStr);
    expect(output).toStrictEqual({
      completeChunks: ["yee hawww", "cowboy"],
      done: false,
      incompleteChunk: `{"id": 123`,
    });
  });

  it("test spaces dealt with ok with chunk split mid sentence", () => {
    const firstChunk = `data: {"choices":[{"index":0,"delta":{"content":"double `;
    const nextChunk = ` space"},"finish_reason":null}]}`;
    const output1 = parseGPTStreamedData(firstChunk);
    const incompleteChunk = output1.incompleteChunk;
    const output2 = parseGPTStreamedData(incompleteChunk + nextChunk);

    console.log(output2);

    expect(output2).toStrictEqual({
      completeChunks: ["double  space"],
      done: false,
      incompleteChunk: null,
    });
  });
});

describe("parseFollowUpSuggestions", () => {
  it("Simple", () => {
    const out = parseFollowUpSuggestions(`- How are you feeling?
- What's up with you?
- What time is it right now .com?`);
    expect(out).toStrictEqual([
      "How are you feeling?",
      "What's up with you?",
      "What time is it right now .com?",
    ]);
  });
  it("Empty lines", () => {
    const out = parseFollowUpSuggestions(`- How are you feeling?


- What's up with you?
- What time is it right now .com?`);
    expect(out).toStrictEqual([
      "How are you feeling?",
      "What's up with you?",
      "What time is it right now .com?",
    ]);
  });
  it("Extra text", () => {
    const out =
      parseFollowUpSuggestions(`Absolutely! Let me handle that for you right away.

- How are you feeling?
- What's up with you?
- What time is it right now .com?`);
    expect(out).toStrictEqual([
      "How are you feeling?",
      "What's up with you?",
      "What time is it right now .com?",
    ]);
  });
  it("4 suggestions", () => {
    const out = parseFollowUpSuggestions(`- How are you feeling?
- What's up with you?
- What time is it right now .com?
- Who are you really?`);
    expect(out).toStrictEqual([
      "How are you feeling?",
      "What's up with you?",
      "What time is it right now .com?",
      "Who are you really?",
    ]);
  });
  it("Start with 'suggested question 1:'", () => {
    const out =
      parseFollowUpSuggestions(`- Suggested question 1: How are you feeling?
- Suggested question 2: What's up with you?
- Suggested question 3: What time is it right now .com?`);
    expect(out).toStrictEqual([
      "How are you feeling?",
      "What's up with you?",
      "What time is it right now .com?",
    ]);
  });
  it("Starts with 'suggestion 1:'", () => {
    const out = parseFollowUpSuggestions(`- Suggestion 2: How are you feeling?
- Suggestion 2: What's up with you?
- Suggestion 3: What time is it right now .com?`);
    expect(out).toStrictEqual([
      "How are you feeling?",
      "What's up with you?",
      "What time is it right now .com?",
    ]);
  });
});
