import { httpsCallable } from "firebase/functions";
import { functions } from "~/lib/firebase";

export async function getResumeFeedback({
  resumeText,
  jobTitle,
  jobDescription,
}: {
  resumeText: string;
  jobTitle: string;
  jobDescription: string;
}) {
  const analyzeResume = httpsCallable(functions, "analyzeResume");

  const result = await analyzeResume({
    resumeText,
    jobTitle,
    jobDescription,
  });

  return result.data;
}
