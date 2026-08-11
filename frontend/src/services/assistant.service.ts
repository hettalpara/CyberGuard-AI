import { apiClient } from "@/lib/api-client";
import type { ApiResponse, ChatSession, ChatMessage, AssistantPrompt } from "@/types";

export const assistantService = {
  sendMessage: (data: AssistantPrompt) =>
    apiClient.post<ApiResponse<ChatMessage>>("/assistant/chat", data),

  getSessions: () =>
    apiClient.get<ApiResponse<ChatSession[]>>("/assistant/sessions"),
};
