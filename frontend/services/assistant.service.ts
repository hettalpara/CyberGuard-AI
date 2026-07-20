import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { ChatSession, ChatMessage, AssistantPrompt } from "@/features/assistant/types";

export const assistantService = {
  sendMessage: (data: AssistantPrompt) =>
    apiClient.post<ApiResponse<ChatMessage>>("/assistant/chat", data),

  getSessions: () =>
    apiClient.get<ApiResponse<ChatSession[]>>("/assistant/sessions"),
};
