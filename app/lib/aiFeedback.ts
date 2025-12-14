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

  const raw = (result.data as any).raw;
  return JSON.parse(raw);
}
