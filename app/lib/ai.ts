import { httpsCallable } from "firebase/functions";
import { functions } from "~/lib/firebase";
import type { Feedback } from "~/types/feedback";

export async function getResumeFeedback({
  resumeText,
  jobTitle,
  jobDescription,
}: {
  resumeText: string;
  jobTitle: string;
  jobDescription: string;
}): Promise<Feedback> {
  const analyzeResume = httpsCallable(functions, "analyzeResume");

  const result = await analyzeResume({
    resumeText,
    jobTitle,
    jobDescription,
  });

  const data = result.data as any;

  // helper to ensure fields exist and normalize naming
  const normalize = (raw: any): Feedback => {
    const pickCategory = (c: any) => ({
      score: typeof c?.score === "number" ? c.score : 0,
      tips: Array.isArray(c?.tips)
        ? c.tips
        : Array.isArray(c?.suggestions)
        ? c.suggestions
        : [],
    });

    const fb: any = typeof raw === "string" ? JSON.parse(raw) : raw || {};

    return {
      overallScore:
        typeof fb.overallScore === "number" ? fb.overallScore : fb.overall || 0,
      toneAndStyle: pickCategory(fb.toneAndStyle || fb.tone || {}),
      content: pickCategory(fb.content || {}),
      structure: pickCategory(fb.structure || {}),
      skills: pickCategory(fb.skills || {}),
      ATS: {
        score:
          typeof (fb.ATS?.score ?? fb.ats?.score) === "number"
            ? fb.ATS?.score ?? fb.ats?.score
            : 0,
        suggestions: Array.isArray(fb.ATS?.suggestions)
          ? fb.ATS.suggestions
          : Array.isArray(fb.ats?.suggestions)
          ? fb.ats.suggestions
          : Array.isArray(fb.ATS?.tips)
          ? fb.ATS.tips
          : [],
      },
      strengths: Array.isArray(fb.strengths)
        ? fb.strengths
        : fb.strength
        ? [fb.strength]
        : [],
      weaknesses: Array.isArray(fb.weaknesses)
        ? fb.weaknesses
        : fb.weakness
        ? [fb.weakness]
        : [],
      recommendations: Array.isArray(fb.recommendations)
        ? fb.recommendations
        : fb.recommendation
        ? [fb.recommendation]
        : [],
    } as Feedback;
  };

  if (data && typeof data.raw === "string") {
    try {
      return normalize(data.raw);
    } catch (err) {
      console.error("Failed to parse raw feedback JSON:", err);
      return data as Feedback;
    }
  }

  return normalize(data);
}
