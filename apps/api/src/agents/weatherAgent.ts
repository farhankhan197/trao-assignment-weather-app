import { ChatGroq } from '@langchain/groq';
import {
  HumanMessage,
  AIMessage,
  ToolMessage,
  SystemMessage,
  BaseMessage,
} from '@langchain/core/messages';
import { createWeatherTools } from './tools';

const MAX_ITERATIONS = 10;

const SYSTEM_PROMPT = `You are Mausam, a friendly and knowledgeable personal weather analyst.

Your job is to help users with weather-related questions using the available tools.

Guidelines:
- Always use tools to get real data. Never guess or make up weather information.
- If the user asks about a city they have NOT saved, use search_city_weather.
- If the user asks about a city they HAVE saved, use get_weather_current or get_weather_forecast.
- If the user asks about multiple cities, use compare_cities (pass all city names at once).
- If the user asks "what can you do?" or wants to know your capabilities, use list_agent_capabilities.
- If the user mentions calendar events or upcoming trips, use get_calendar_weather_alerts.
- If the user asks about weather patterns over time, use get_weather_streak.
- Be concise, friendly, and use emoji. Use bullet points for comparisons.
- After getting tool results, summarize them in natural language. Do not repeat raw tool output verbatim.`;

export const runWeatherAgent = async (userId: string, userMessage: string): Promise<string> => {
  const llm = new ChatGroq({
    model: 'openai/gpt-oss-120b',
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.3,
  });

  const tools = createWeatherTools(userId);
  const toolMap = new Map(tools.map((t) => [t.name, t]));
  const modelWithTools = llm.bindTools(tools);

  const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT), new HumanMessage(userMessage)];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let response;
    try {
      response = await modelWithTools.invoke(messages);
    } catch (err: any) {
      throw new Error(`LLM invoke failed: ${err.message}`);
    }

    // If the model returns tool calls, execute them and continue the loop
    if (response.tool_calls && response.tool_calls.length > 0) {
      messages.push(response);

      for (const toolCall of response.tool_calls) {
        const tool = toolMap.get(toolCall.name);
        let toolResult: string;

        if (tool) {
          try {
            toolResult = await tool.invoke(toolCall.args);
          } catch (err: any) {
            toolResult = `Error: ${err.message || 'Tool execution failed'}`;
          }
        } else {
          toolResult = `Error: Tool "${toolCall.name}" not found.`;
        }

        messages.push(
          new ToolMessage({
            content: String(toolResult),
            tool_call_id: toolCall.id!,
            name: toolCall.name,
          })
        );
      }
    } else {
      // No tool calls — return the final response
      return String(response.content);
    }
  }

  // Max iterations reached — return last message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && 'content' in lastMessage) {
    return String((lastMessage as any).content);
  }

  return 'I was unable to complete your request after multiple attempts. Please try rephrasing your question.';
};
