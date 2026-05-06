import { ChatAnthropic } from '@langchain/anthropic';
import { AgentExecutor, createReactAgent } from 'langchain/agents';
import { pull } from 'langchain/hub';
import { createWeatherTools } from './tools';

export const runWeatherAgent = async (userId: string, userMessage: string): Promise<string> => {
  const llm = new ChatAnthropic({
    model: 'claude-haiku-4-5-20251001',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.3,
  });

  const tools = createWeatherTools(userId);

  // Pull the standard ReAct prompt from LangChain Hub
  const prompt = await pull<any>('hwchase17/react');

  const agent = await createReactAgent({ llm, tools, prompt });

  const executor = new AgentExecutor({
    agent,
    tools,
    maxIterations: 5,
    verbose: false,
  });

  const result = await executor.invoke({
    input: userMessage,
  });

  return result.output as string;
};
