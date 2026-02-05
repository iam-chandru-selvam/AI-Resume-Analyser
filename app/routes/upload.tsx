import { type FormEvent, useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { generateUUID } from "~/lib/utils";
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

      // 🤖 AI (Cloud Function handles PDF parsing)
      setStatusText("Analyzing resume with AI...");
      const feedback = await getResumeFeedback({
        resumePdfUrl,
        jobTitle,
        jobDescription,
      });

      // 💾 Save result
      await setDoc(doc(db, "resumes", uuid), {
        userId: user.uid,
        companyName,
        jobTitle,
        jobDescription,
        resumePdfUrl,
        feedback,
        createdAt: serverTimestamp(),
      });

      window.location.href = `/resume/${uuid}`;
    } catch (err) {
      console.error(err);
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
    <main>
      <Navbar />

      <section className="main-section">
        <h1>Smart feedback for your dream job</h1>

        {isProcessing ? (
          <p>{statusText}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input name="company-name" required />
            <input name="job-title" required />
            <textarea name="job-description" />
            <FileUploader onFileSelect={handleFileSelect} />
            <button>Analyze Resume</button>
          </form>
        )}
      </section>
    </main>
  );
};

export default Upload;
