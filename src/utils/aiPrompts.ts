import { Task } from '../types/task';

export function buildParseEventPrompt(input: string, timezone: string): string {
  const now = new Date().toISOString();
  return `You are LiveNote, an AI scheduling assistant. Parse the following user input into a calendar event.

Current time: ${now}
User timezone: ${timezone}

User input: "${input}"

Extract the event details. For relative times like "tomorrow", "next Tuesday", "in 2 weeks", calculate the exact date based on the current time. For vague times like "afternoon" use 14:00, "morning" use 09:00, "evening" use 19:00.`;
}

export function buildWhatsOnTodayPrompt(tasks: Task[], userName: string): string {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const taskList = tasks
    .filter((t) => !t.completion_status)
    .map((t) => `- ${t.title}${t.scheduled_time ? ` at ${new Date(t.scheduled_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''} [${t.priority} priority]`)
    .join('\n');

  return `You are LiveNote, a friendly AI calendar assistant. Give ${userName} a brief, conversational summary of their day.

Today is ${today}.

Today's tasks:
${taskList || 'No tasks scheduled.'}

Keep it friendly, concise (2-4 sentences), and mention any high-priority items. End with an encouraging note or a helpful offer.`;
}

export function buildStudyPlanPrompt(goal: string, deadline: Date, existingTasks: Task[]): string {
  const now = new Date();
  const daysUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const busyTimes = existingTasks
    .filter((t) => t.scheduled_time)
    .map((t) => `${new Date(t.scheduled_time!).toLocaleDateString()} ${new Date(t.scheduled_time!).toLocaleTimeString()}`)
    .join(', ');

  return `You are LiveNote. Create a study plan for the following goal.

Goal: ${goal}
Deadline: ${deadline.toISOString()}
Days available: ${daysUntilDeadline}
Already busy: ${busyTimes || 'nothing scheduled yet'}

Create evenly distributed study sessions. Each session should be 60–90 minutes. Avoid scheduling on already-busy time slots. Start sessions from tomorrow.`;
}

export function buildChatSystemPrompt(userName: string, todayTasks: Task[]): string {
  const taskSummary = todayTasks
    .map((t) => `- ${t.title} (${t.priority} priority, ${t.completion_status ? 'done' : 'pending'})`)
    .join('\n');

  return `You are LiveNote, a friendly AI-powered calendar and task management assistant for ${userName}.

Today's schedule:
${taskSummary || 'No tasks today.'}

Help the user manage their schedule. You can:
- Schedule new tasks (tell them what you would schedule and confirm)
- Reschedule existing tasks
- Break large tasks into smaller steps
- Suggest optimal times based on their schedule
- Answer questions about productivity and time management

Be concise, friendly, and proactive. If the user describes something that should be scheduled, extract the details and confirm before creating.`;
}
