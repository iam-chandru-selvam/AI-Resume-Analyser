import { type FormEvent, useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { extractTextFromPdf } from "~/lib/pdfText";
import { getResumeFeedback } from "~/lib/ai";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, storage } from "~/lib/firebase";

const Upload = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => setFile(file);

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    const user = auth.currentUser;
    if (!user) return;

    setIsProcessing(true);

    try {
      const uuid = generateUUID();

      // 📄 Upload PDF
      setStatusText("Uploading resume...");
      const pdfRef = ref(storage, `resumes/${user.uid}/${uuid}.pdf`);
      await uploadBytes(pdfRef, file);
      const resumePdfUrl = await getDownloadURL(pdfRef);

      // 🖼 Preview image
      setStatusText("Generating preview...");
      const imageResult = await convertPdfToImage(file);
      if (!imageResult.file) throw new Error("Image conversion failed");

      const imageRef = ref(storage, `resumes/${user.uid}/${uuid}.png`);
      await uploadBytes(imageRef, imageResult.file);
      const imageUrl = await getDownloadURL(imageRef);

      // 📄 Extract text
      setStatusText("Reading resume text...");
      const resumeText = await extractTextFromPdf(file);

      console.log("Resume text length:", resumeText.length);

      if (!resumeText || resumeText.length < 50) {
        throw new Error("Resume text extraction failed");
      }

      // 🤖 AI via Cloud Function
      setStatusText("Analyzing resume with AI...");
      const feedback = await getResumeFeedback({
        resumeText,
        jobTitle,
        jobDescription,
      });

      // 💾 Save
      setStatusText("Saving results...");
      await setDoc(doc(db, "resumes", uuid), {
        userId: user.uid,
        companyName,
        jobTitle,
        jobDescription,
        resumePdfUrl,
        imageUrl,
        feedback,
        createdAt: serverTimestamp(),
      });

      window.location.href = `/resume/${uuid}`;
    } catch (error) {
      console.error("Upload / AI error:", error);
      alert("AI analysis failed. Check console.");
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData(e.currentTarget);

    handleAnalyze({
      companyName: formData.get("company-name") as string,
      jobTitle: formData.get("job-title") as string,
      jobDescription: formData.get("job-description") as string,
      file,
    });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>

          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}

          {!isProcessing && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
              <div className="form-div">
                <label>Company Name</label>
                <input name="company-name" required />
              </div>

              <div className="form-div">
                <label>Job Title</label>
                <input name="job-title" required />
              </div>

              <div className="form-div">
                <label>Job Description</label>
                <textarea name="job-description" rows={5} />
              </div>

              <div className="form-div">
                <label>Upload Resume (PDF)</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button className="primary-button">Analyze Resume</button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
