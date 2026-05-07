import { ChatGroq } from '@langchain/groq';
import { HumanMessage, AIMessage, ToolMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';
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
  console.log('[Agent] Starting agent for user:', userId);
  console.log('[Agent] User message:', userMessage);
  console.log('[Agent] GROQ_API_KEY present?', !!process.env.GROQ_API_KEY);

  let llm;
  try {
    llm = new ChatGroq({
      model: 'openai/gpt-oss-120b',
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0.3,
    });
    console.log('[Agent] ChatGroq instance created successfully');
  } catch (err: any) {
    console.error('[Agent] Failed to create ChatGroq:', err.message, err.stack);
    throw new Error(`ChatGroq init failed: ${err.message}`);
  }

  let tools;
  try {
    tools = createWeatherTools(userId);
    console.log('[Agent] Tools created:', tools.map(t => t.name).join(', '));
  } catch (err: any) {
    console.error('[Agent] Failed to create tools:', err.message, err.stack);
    throw new Error(`Tool creation failed: ${err.message}`);
  }

  const toolMap = new Map(tools.map((t) => [t.name, t]));
  
  let modelWithTools;
  try {
    modelWithTools = llm.bindTools(tools);
    console.log('[Agent] bindTools() succeeded');
  } catch (err: any) {
    console.error('[Agent] bindTools() failed:', err.message, err.stack);
    throw new Error(`bindTools failed: ${err.message}`);
  }

  const messages: BaseMessage[] = [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(userMessage),
  ];
  console.log('[Agent] Initial messages prepared');

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(`[Agent] Iteration ${i + 1}/${MAX_ITERATIONS} starting...`);
    
    let response;
    try {
      response = await modelWithTools.invoke(messages);
      console.log('[Agent] modelWithTools.invoke() succeeded');
      console.log('[Agent] Response type:', typeof response);
      console.log('[Agent] Response content preview:', String(response.content || '').slice(0, 200));
      console.log('[Agent] Response has tool_calls?', !!(response.tool_calls && response.tool_calls.length > 0));
      if (response.tool_calls) {
        console.log('[Agent] Tool calls count:', response.tool_calls.length);
      }
    } catch (err: any) {
      console.error('[Agent] modelWithTools.invoke() FAILED:', err.message);
      console.error('[Agent] Error stack:', err.stack);
      throw new Error(`LLM invoke failed: ${err.message}`);
    }

    // If the model returns tool calls, execute them and continue the loop
    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log('[Agent] Processing tool calls...');
      messages.push(response);

      for (const toolCall of response.tool_calls) {
        console.log(`[Agent] Tool call: ${toolCall.name}, args:`, JSON.stringify(toolCall.args));
        const tool = toolMap.get(toolCall.name);
        let toolResult: string;

        if (tool) {
          console.log(`[Agent] Found tool ${toolCall.name}, invoking...`);
          try {
            toolResult = await tool.invoke(toolCall.args);
            console.log(`[Agent] Tool ${toolCall.name} result preview:`, String(toolResult).slice(0, 200));
          } catch (err: any) {
            console.error(`[Agent] Tool ${toolCall.name} FAILED:`, err.message, err.stack);
            toolResult = `Error: ${err.message || 'Tool execution failed'}`;
          }
        } else {
          console.error(`[Agent] Tool not found: ${toolCall.name}`);
          toolResult = `Error: Tool "${toolCall.name}" not found.`;
        }

        messages.push(
          new ToolMessage({
            content: String(toolResult),
            tool_call_id: toolCall.id!,
            name: toolCall.name,
          })
        );
        console.log(`[Agent] ToolMessage added to conversation`);
      }
    } else {
      // No tool calls — return the final response
      console.log('[Agent] No tool calls detected, returning response.content');
      return String(response.content);
    }
  }

  // Max iterations reached — return last message
  console.log('[Agent] Max iterations reached');
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && 'content' in lastMessage) {
    return String((lastMessage as any).content);
  }

  return 'I was unable to complete your request after multiple attempts. Please try rephrasing your question.';
};