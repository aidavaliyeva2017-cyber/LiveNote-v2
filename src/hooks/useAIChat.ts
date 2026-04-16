import { useState, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { ChatMessage } from '../types/ai';
import { CalendarEvent } from '../types/event';
import { AI_MODEL, OLLAMA_BASE_URL } from '../constants/api';

// ─── Prompt builder ───────────────────────────────────────────────────────────
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
              `• ${e.title} at ${format(e.start, 'HH:mm')} — ${e.priority} priority — ${
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

// ─── Ollama chat call ─────────────────────────────────────────────────────────
async function callOllamaAPI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string
): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.message?.content ?? '';
}

// ─── Event extraction via Ollama ──────────────────────────────────────────────
async function extractEventFromMessage(
  userText: string
): Promise<Pick<CalendarEvent, 'title' | 'start' | 'end'> | null> {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const systemPrompt = `You are a calendar event extractor. Today is ${format(today, 'EEEE yyyy-MM-dd')}.

If the user wants to schedule something, respond with ONLY valid JSON in this exact format (no other text):
{"title":"Event Title","date":"YYYY-MM-DD","time":"HH:MM","duration_minutes":60}

Rules:
- "tomorrow" = ${format(tomorrow, 'yyyy-MM-dd')}
- "today" = ${format(today, 'yyyy-MM-dd')}
- Use 24-hour time (e.g. "09:00", "14:30")
- Default duration: 60 minutes
- If no time mentioned, use "09:00"

If no scheduling intent, respond with exactly: null`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText },
        ],
        stream: false,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const raw = (data.message?.content ?? '').trim();

    if (!raw || raw === 'null' || !raw.includes('{')) return null;

    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.title || !parsed.date) return null;

    // new Date("YYYY-MM-DD") parses as UTC midnight → wrong local date in non-UTC timezones.
    const [hourStr, minStr] = (parsed.time ?? '09:00').split(':');
    const [py, pm, pd] = parsed.date.split('-').map(Number);
    const start = new Date(py, pm - 1, pd, parseInt(hourStr, 10), parseInt(minStr ?? '0', 10), 0, 0);
    if (isNaN(start.getTime())) return null;

    const end = new Date(start.getTime() + (parsed.duration_minutes ?? 60) * 60 * 1000);

    return { title: parsed.title, start, end };
  } catch {
    return null;
  }
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
  if (!signal.aborted) onChunk(fullText);
}

// ─── Fallback when Ollama is not reachable ────────────────────────────────────
function buildFallbackResponse(userText: string, events: CalendarEvent[]): string {
  const lower = userText.toLowerCase();
  const today = new Date();
  const todayEvents = events.filter(
    (e) => e.start.toDateString() === today.toDateString()
  );

  if (lower.includes('today') || lower.includes('schedule')) {
    if (todayEvents.length === 0) {
      return "Your day is completely free! Add some tasks via the + button and I'll help you stay on track.";
    }
    const pending = todayEvents.filter((e) => !e.completed);
    const done = todayEvents.filter((e) => e.completed);
    return (
      `You have **${pending.length} task${pending.length !== 1 ? 's' : ''}** remaining today` +
      (done.length > 0 ? ` and already completed ${done.length}. Great work! 🎉` : '.') +
      (pending[0] ? `\n\nUp next: **${pending[0].title}** at ${format(pending[0].start, 'HH:mm')}.` : '')
    );
  }

  if (lower.includes('add') || lower.includes('schedule') || lower.includes('create')) {
    return "Sure! Tell me what you want to schedule — for example: *'Doctor appointment next Tuesday at 3pm'* or *'Study session tomorrow morning for 2 hours'*.";
  }

  if (lower.includes('study') || lower.includes('exam') || lower.includes('plan')) {
    return "I can help you create a study plan! Tell me:\n• What subject or topic?\n• When is the deadline or exam?\n• How many hours can you study per day?";
  }

  if (lower.includes('tip') || lower.includes('productivity')) {
    const tips = [
      '**Time blocking** works better than to-do lists. Reserve specific time slots for specific tasks — treat them like appointments.',
      'Use the **2-minute rule**: if a task takes less than 2 minutes, do it immediately rather than scheduling it.',
      'Your most important task deserves your **first 90 minutes**. Protect your mornings from meetings and distractions.',
      '**Batch similar tasks** together. Answer all messages at once, make all calls in one block, rather than context-switching constantly.',
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  return "I'm here to help you manage your schedule! You can ask me to:\n• Show today's schedule\n• Add a new task\n• Create a study plan\n• Give productivity tips\n\nWhat would you like to do?";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAIChat(userName: string, events: CalendarEvent[]) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [ollamaError, setOllamaError] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<Pick<CalendarEvent, 'title' | 'start' | 'end'> | null>(null);
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

        try {
          // Run chat response and event extraction in parallel
          const [response, eventDraft] = await Promise.all([
            callOllamaAPI(history, systemPrompt),
            extractEventFromMessage(text),
          ]);
          fullResponse = response;
          setOllamaError(false);
          if (eventDraft) setPendingEvent(eventDraft);
        } catch (ollamaErr) {
          if (ollamaErr instanceof TypeError) {
            // Network error — Ollama not reachable
            setOllamaError(true);
            await new Promise((r) => setTimeout(r, 300));
            fullResponse = buildFallbackResponse(text, events);
          } else {
            throw ollamaErr;
          }
        }

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
  const clearPendingEvent = useCallback(() => setPendingEvent(null), []);

  return {
    messages,
    isStreaming,
    ollamaError,
    pendingEvent,
    clearPendingEvent,
    sendMessage,
    stopStreaming,
    clearHistory,
  };
}
