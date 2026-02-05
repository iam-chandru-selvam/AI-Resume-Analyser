import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

const analyzeResumeFn = httpsCallable(functions, "analyzeResume");

export async function getResumeFeedback(data: {
  resumePdfUrl: string;
  jobTitle: string;
  jobDescription: string;
}) {
  const res = await analyzeResumeFn(data);
  return res.data;
}
