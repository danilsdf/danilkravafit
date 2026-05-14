import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";

export async function POST(req: Request) {
  const { goal, duration, availableDays, availableTimeSlots, experienceLevel } =
    await req.json();

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

  const daysLabel = Array.isArray(availableDays) ? availableDays.join(", ") : availableDays;
  const timeSlotsLabel = Array.isArray(availableTimeSlots)
    ? availableTimeSlots.map((s: { day: string; time: string; duration: number }) => `${s.day}: ${s.time} (${s.duration} min)`).join(", ")
    : availableTimeSlots;

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are an elite hybrid athlete coach. Generate a highly structured, realistic training program. 
Always return a valid JSON object only — no markdown, no prose, no code fences.
The JSON must strictly follow this schema:
{
  "programTitle": string,
  "goal": string,
  "duration": string,
  "experienceLevel": string,
  "weeklySchedule": [
    {
      "week": number,
      "focus": string,
      "progressionNote": string,
      "workouts": [
        {
          "title": string,
          "description": string,
          "durationMinutes": number,
          "date": null,
          "dayOfWeek": string,
          "time": string,
          "workoutType": "run" | "strength" | "hiit" | "cycling" | "yoga" | "mobility" | "rest" | "crossfit" | "swim",
          "intensity": "easy" | "moderate" | "hard" | "max"
        }
      ]
    }
  ],
  "progressionPlan": {
    "weeks1to2": string,
    "weeks3to4": string,
    "weeks5to6": string,
    "weeks7to8": string
  },
  "generalTips": string[]
}
Fill progressionPlan only for the weeks that exist in the program. Use null for inapplicable week ranges.
Each workout day must use one of the availableDays provided. Rest days should also be listed.`,
    prompt: `Create a ${duration} training program for the following athlete:
- Goal: ${goal}
- Training days available: ${daysLabel}
- Time slots: ${timeSlotsLabel}
- Experience level: ${experienceLevel}

Generate a complete, realistic program. Include a full weekly schedule for every week, with workout titles in the style of:
- "Easy Run — 8 km Zone 2"
- "Hill Repeats — 10×400 m"
- "Upper Push — 4×8 Bench + Overhead Press"
- "Long Run — 16 km Aerobic"
Each workout must have a concise but informative description covering what to do and why. 
The program must show clear progression week over week (volume, intensity, or complexity increases).
Make sure the json is well-formed and strictly adheres to the schema. Do not include any explanations or notes outside the JSON.`,
  });

  return result.toTextStreamResponse();
}
