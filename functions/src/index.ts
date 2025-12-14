import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

admin.initializeApp();

export const analyzeResume = functions.https.onCall(async (data, context) => {
  const resumeText = data.resumeText as string;
  const jobTitle = data.jobTitle as string;
  const jobDescription = data.jobDescription as string;

  if (!resumeText || !jobTitle) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing resumeText or jobTitle"
    );
  }

  // 🔐 Read API key safely. Prefer Functions config, but allow an env
  // var fallback for local testing or alternate deployments. The
  // recommended production approach is to run:
  //   firebase functions:config:set gemini.key="<KEY>"
  // and then `firebase deploy --only functions`.
  const apiKeyFromConfig = functions.config().gemini?.key;
  const apiKeyFromEnv =
    process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const apiKey = apiKeyFromConfig || apiKeyFromEnv;

  if (!apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      'Gemini API key not configured. Set it with `firebase functions:config:set gemini.key="<KEY>"` or set env var GEMINI_API_KEY.'
    );
  }

  // 🚀 Initialize Gemini INSIDE function (CRITICAL)
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = `
You are an ATS resume reviewer.

Job Title: ${jobTitle}
Job Description: ${jobDescription}

Resume:
${resumeText}

Return JSON with:
overallScore,
toneAndStyle,
content,
structure,
skills,
ATS
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return { raw: text };
});
