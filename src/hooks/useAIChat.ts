import { useState, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { ChatMessage } from '../types/ai';
import { CalendarEvent } from '../types/event';
import { ENV } from '../config/env';
import { AI_MODEL } from '../constants/api';

// ─── Prompt builder (works with CalendarEvent[]) ─────────────────────────────
function buildSystemPrompt(userName: string, events: CalendarEvent[]): string {
  const today = new Date();
  const todayEvents = events.filter(
    (e) => e.start.toDateString() === today.toDateString()
  );
  const taskList =
    todayEvents.length === 0
      ? 'Nothing scheduled yet.'
      : todayEvents
          .map(
            (e) =>
              `• ${e.title} at ${format(e.start, 'h:mm a')} — ${e.priority} priority — ${
                e.completed ? 'done ✓' : 'pending'
              }`
          )
          .join('\n');

  return `You are LiveNote, a friendly and smart AI calendar assistant for ${userName}.
Today is ${format(today, 'EEEE, MMMM d, yyyy')}.

${userName}'s schedule today:
${taskList}

Your capabilities:
- Help schedule new tasks (describe what and when, then confirm)
- Give daily summaries and productivity advice
- Help create study/prep plans for upcoming deadlines
- Answer questions about time management

Keep replies concise and friendly. Use bullet points for lists. When the user wants to schedule something, confirm the details before creating it.`;
}

// ─── Anthropic REST API call (works in React Native) ─────────────────────────
async function callAnthropicAPI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}

// ─── Simulate streaming reveal ────────────────────────────────────────────────
async function revealText(
  fullText: string,
  onChunk: (partial: string) => void,
  signal: AbortSignal
): Promise<void> {
  const chunkSize = 3;
  for (let i = chunkSize; i <= fullText.length; i += chunkSize) {
    if (signal.aborted) break;
    onChunk(fullText.slice(0, i));
    await new Promise<void>((resolve) => setTimeout(resolve, 16));
  }
  if (!signal.aborted) onChunk(fullText); // ensure full text at the end
}

// ─── Fallback when no API key is set ─────────────────────────────────────────
function buildFallbackResponse(userText: string, events: CalendarEvent[]): string {
  const lower = userText.toLowerCase();
  const today = new Date();
  const todayEvents = events.filter(
    (e) => e.start.toDateString() === today.toDateString()
  );

  if (lower.includes("today") || lower.includes("schedule")) {
    if (todayEvents.length === 0) {
      return "Your day is completely free! Add some tasks via the + button and I'll help you stay on track.";
    }
    const pending = todayEvents.filter((e) => !e.completed);
    const done = todayEvents.filter((e) => e.completed);
    return (
      `You have **${pending.length} task${pending.length !== 1 ? 's' : ''}** remaining today` +
      (done.length > 0 ? ` and already completed ${done.length}. Great work! 🎉` : '.') +
      (pending[0] ? `\n\nUp next: **${pending[0].title}** at ${format(pending[0].start, 'h:mm a')}.` : '')
    );
  }

  if (lower.includes("add") || lower.includes("schedule") || lower.includes("create")) {
    return "Sure! Tell me what you want to schedule — for example: *'Doctor appointment next Tuesday at 3pm'* or *'Study session tomorrow morning for 2 hours'*.";
  }

  if (lower.includes("study") || lower.includes("exam") || lower.includes("plan")) {
    return "I can help you create a study plan! Tell me:\n• What subject or topic?\n• When is the deadline or exam?\n• How many hours can you study per day?";
  }

  if (lower.includes("tip") || lower.includes("productivity")) {
    const tips = [
      "**Time blocking** works better than to-do lists. Reserve specific time slots for specific tasks — treat them like appointments.",
      "Use the **2-minute rule**: if a task takes less than 2 minutes, do it immediately rather than scheduling it.",
      "Your most important task deserves your **first 90 minutes**. Protect your mornings from meetings and distractions.",
      "**Batch similar tasks** together. Answer all messages at once, make all calls in one block, rather than context-switching constantly.",
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  return "I'm here to help you manage your schedule! You can ask me to:\n• Show today's schedule\n• Add a new task\n• Create a study plan\n• Give productivity tips\n\nWhat would you like to do?";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAIChat(userName: string, events: CalendarEvent[]) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      const assistantId = `a-${Date.now() + 1}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const systemPrompt = buildSystemPrompt(userName, events);
        const history = [...messages, userMsg].map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        let fullResponse: string;

        const apiKey = ENV.ANTHROPIC_API_KEY;
        if (apiKey && apiKey.length > 10) {
          fullResponse = await callAnthropicAPI(history, systemPrompt, apiKey);
        } else {
          // Demo mode — no API key needed
          await new Promise((r) => setTimeout(r, 600)); // simulate latency
          fullResponse = buildFallbackResponse(text, events);
        }

        // Reveal text progressively
        await revealText(
          fullResponse,
          (partial) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: partial } : m
              )
            );
          },
          controller.signal
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Sorry, something went wrong: ${errMsg}` }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, userName, events]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearHistory = useCallback(() => setMessages([]), []);

  return { messages, isStreaming, sendMessage, stopStreaming, clearHistory };
}
