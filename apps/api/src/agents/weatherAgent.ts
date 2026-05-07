import { ChatGroq } from '@langchain/groq';
import { HumanMessage, AIMessage, ToolMessage, BaseMessage } from '@langchain/core/messages';
import { createWeatherTools } from './tools';

const MAX_ITERATIONS = 5;

export const runWeatherAgent = async (userId: string, userMessage: string): Promise<string> => {
  const llm = new ChatGroq({
    model: 'openai/gpt-oss-120b',
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.3,
  });

  const tools = createWeatherTools(userId);
  const toolMap = new Map(tools.map((t) => [t.name, t]));
  const modelWithTools = llm.bindTools(tools);

  const messages: BaseMessage[] = [
    new HumanMessage(userMessage),
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await modelWithTools.invoke(messages);

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
