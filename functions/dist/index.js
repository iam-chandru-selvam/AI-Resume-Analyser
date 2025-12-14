"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeResume = void 0;
const functions = __importStar(require("firebase-functions"));
const generative_ai_1 = require("@google/generative-ai");
exports.analyzeResume = functions.https.onCall(async (data) => {
    const { resumeText, jobTitle, jobDescription } = data;
    if (!resumeText || !jobTitle) {
        throw new functions.https.HttpsError("invalid-argument", "Missing resumeText or jobTitle");
    }
    const apiKey = functions.config().gemini.key;
    if (!apiKey) {
        throw new functions.https.HttpsError("failed-precondition", "Gemini API key not set");
    }
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
    });
    const prompt = `
You are an ATS resume expert.

Resume:
${resumeText}

Job Title:
${jobTitle}

Job Description:
${jobDescription}

Return JSON only with:
- overallScore
- toneAndStyle { score, tips[] }
- content { score, tips[] }
- structure { score, tips[] }
- skills { score, tips[] }
- ATS { score, tips[] }
`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
});
