import { anthropic } from '../config/anthropic';
import { AI_MODEL, AI_MAX_TOKENS } from '../constants/api';
import { ParsedEventDraft, StudyPlan, ChatMessage } from '../types/ai';
import { Task } from '../types/task';
import {
  buildParseEventPrompt,
  buildWhatsOnTodayPrompt,
  buildStudyPlanPrompt,
  buildChatSystemPrompt,
} from '../utils/aiPrompts';

export async function parseNaturalLanguageEvent(
  input: string,
  timezone: string
): Promise<ParsedEventDraft> {
  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    tools: [
      {
        name: 'schedule_event',
        description: 'Extract event details from natural language and return structured data',
        input_schema: {
          type: 'object' as const,
          properties: {
            title:            { type: 'string' as const },
            scheduled_time:   { type: 'string' as const, description: 'ISO 8601 datetime' },
            duration_minutes: { type: 'number' as const },
            priority:         { type: 'string' as const, enum: ['high', 'medium', 'low'] },
            category_name:    { type: 'string' as const },
            confidence:       { type: 'number' as const },
          },
          required: ['title', 'confidence'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'schedule_event' },
    messages: [{ role: 'user', content: buildParseEventPrompt(input, timezone) }],
  });

  const toolUse = message.content.find((b: { type: string }) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('AI parsing failed');
  return toolUse.input as ParsedEventDraft;
}

export async function generateWhatsOnToday(
  tasks: Task[],
  userName: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: buildWhatsOnTodayPrompt(tasks, userName) }],
  });

  const block = message.content[0];
  return block.type === 'text' ? block.text : '';
}

export async function generateStudyPlan(
  goal: string,
  deadline: Date,
  existingTasks: Task[]
): Promise<StudyPlan> {
  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    tools: [
      {
        name: 'create_study_plan',
        description: 'Create a structured study plan with individual sessions',
        input_schema: {
          type: 'object' as const,
          properties: {
            goal:     { type: 'string' },
            deadline: { type: 'string' },
            sessions: {
              type: 'array',
              items: {
                type: 'object' as const,
                properties: {
                  title:            { type: 'string' as const },
                  scheduled_time:   { type: 'string' as const },
                  duration_minutes: { type: 'number' as const },
                  description:      { type: 'string' as const },
                },
                required: ['title', 'scheduled_time', 'duration_minutes'],
              },
            },
          },
          required: ['goal', 'deadline', 'sessions'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'create_study_plan' },
    messages: [{ role: 'user', content: buildStudyPlanPrompt(goal, deadline, existingTasks) }],
  });

  const toolUse = message.content.find((b: { type: string }) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('Study plan generation failed');
  return toolUse.input as StudyPlan;
}

export async function streamChatMessage(
  messages: ChatMessage[],
  userName: string,
  todayTasks: Task[],
  onChunk: (text: string) => void
): Promise<void> {
  const stream = anthropic.messages.stream({
    model: AI_MODEL,
    max_tokens: 1024,
    system: buildChatSystemPrompt(userName, todayTasks),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      onChunk(event.delta.text);
    }
  }
}
