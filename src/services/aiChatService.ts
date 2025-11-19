import axios from 'axios';
import type { 
  AIChatRequest, 
  AIChatResponse, 
  ConversationMessage 
} from '../types/aiChat';

// Backend API URL (same as your existing search backend)
const API_BASE_URL = 'https://backend.carlo587-jcl.workers.dev';

class AIChatService {
  // Send a message to the AI and get a response
  async sendMessage(
    query: string, 
    conversationHistory?: ConversationMessage[]
  ): Promise<AIChatResponse> {
    try {
      const request: AIChatRequest = {
        query,
        conversationHistory,
        maxSources: 5
      };

      const response = await axios.post<AIChatResponse>(
        `${API_BASE_URL}/ai-chat`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout for AI responses
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message;
        throw new Error(errorMessage);
      }
      throw new Error('Failed to get AI response');
    }
  }

  // Regenerate a response (same query but new generation)
  async regenerateResponse(
    query: string,
    conversationHistory?: ConversationMessage[]
  ): Promise<AIChatResponse> {
    return this.sendMessage(query, conversationHistory);
  }

  // Check if the service is available
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const aiChatService = new AIChatService();

// Export type for convenience
export type { AIChatResponse };

