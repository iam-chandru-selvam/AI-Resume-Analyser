import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import pdfParse from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";

admin.initializeApp();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const analyzeResume = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "1GB",
  })
  .https.onCall(async (data: {
    resumePdfUrl: string;
    jobTitle: string;
    jobDescription?: string;
  }) => {

    const { resumePdfUrl, jobTitle, jobDescription } = data;

    if (!resumePdfUrl || !jobTitle) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing resumePdfUrl or jobTitle"
      );
    }

    const response = await fetch(resumePdfUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    const parsed = await pdfParse(buffer);
    const resumeText = parsed.text;

    if (!resumeText || resumeText.length < 50) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Failed to extract resume text"
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.0-pro",
    });

    const prompt = `
Return ONLY valid JSON.

Resume:
${resumeText}

Job Title: ${jobTitle}
Job Description: ${jobDescription ?? ""}
`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  });
