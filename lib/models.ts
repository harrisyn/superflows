import { z } from "zod";
import { ActionPlusApiInfo } from "./types";
import { FunctionCall } from "@superflows/chat-ui-react";

export type ChatGPTMessage =
  | {
      role: "system" | "user" | "assistant";
      content: string;
    }
  | {
      role: "function";
      content: string;
      name: string;
    };

export type GPTMessageInclSummary =
  | {
      role: "system" | "user" | "assistant";
      content: string;
    }
  | {
      role: "function";
      content: string;
      name: string;
      summary?: string;
      urls?: { name: string; url: string }[];
    };

interface MessageChoice {
  message: ChatGPTMessage;
  finish_reason: string;
  index: number;
}

interface TextChoice {
  text: string;
  finish_reason: string;
  index: number;
}

export interface ChatGPTResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };

  choices: MessageChoice[] | TextChoice[];
}

export interface RunPodResponse {
  delayTime: number;
  executionTime: number;
  id: string;
  output: string;
  status: string;
}

export interface OpenAIError {
  message: string;
  type: string;
  param: string | null; // Might not be string
  code: number | null; // Might not be number
}

export interface ChatGPTParams {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[] | null;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Function | null;
  user?: string;
}

export type RequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS";

type NonSystemGPTMessage = Exclude<GPTMessageInclSummary, { role: "system" }>;

export type StreamingStepInput =
  | NonSystemGPTMessage
  | {
      role: "error" | "debug" | "confirmation";
      content: string;
    };

export type StreamingStep = StreamingStepInput & { id: number };
export interface ActionToHttpRequest {
  action: ActionPlusApiInfo;
  parameters: Record<string, unknown>;
  organization: {
    id: number;
  };
  userApiKey?: string;
  stream?: (input: StreamingStepInput) => void;
}

export interface Chunk {
  path: (string | number)[];
  data: any;
}

export interface Properties {
  [key: string | number]: {
    type?: string;
    description?: string;
    path: (string | number)[];
    data?: any;
  };
}

export interface EmbeddingResponse {
  data: { embedding: number[]; index: number; object: string }[];
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

const OptionalStringZod = z.optional(z.string());

export const AnswersZod = z.object({
  user_input: z.string(),
  conversation_id: z.nullable(z.number()),
  user_description: OptionalStringZod,
  user_api_key: OptionalStringZod,
  stream: z.optional(z.boolean()),
  mock_api_responses: z.optional(z.boolean()),
  test_mode: z.optional(z.boolean()),
});

export type AnswersType = z.infer<typeof AnswersZod>;

export interface ToConfirm extends FunctionCall {
  actionId: number;
}
