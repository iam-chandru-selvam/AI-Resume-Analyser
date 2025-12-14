import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "~/lib/firebase";



import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import type { Feedback } from "~/types/feedback";


export const meta = () => [
  { title: "Dru Resumind | Review" },
  { name: "description", content: "Detailed overview of your resume" },
];

const Resume = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Auth Guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate(`/auth?next=/resume/${id}`);
      } else {
        setUser(u);
        setLoading(false);
      }
    });

    return () => unsub();
  }, [id, navigate]);

  // 📦 Load Resume Data
  useEffect(() => {
    if (!user || !id) return;

    const loadResume = async () => {
      const ref = doc(db, "resumes", id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.error("Resume not found");
        return;
      }

      const data = snap.data();

      console.log("Loaded resume data:", data); // Debug (can remove later)

      setResumeUrl(data.resumePdfUrl || "");
      setImageUrl(data.imageUrl || ""); // ✅ FIXED FIELD NAME
      setFeedback(data.feedback || null);
    };

    loadResume();
  }, [user, id]);

  if (loading) {
    return (
      <main className="flex items-center justify-center h-screen">
        <img src="/images/resume-scan-2.gif" className="w-[200px]" />
      </main>
    );
  }

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="back" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>
      </nav>

      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        {/* 🖼 Resume Preview */}
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 flex items-center justify-center">
          {imageUrl && resumeUrl ? (
            <div className="animate-in fade-in duration-1000 gradient-border h-[90%] w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl"
                  title="resume"
                />
              </a>
            </div>
          ) : (
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          )}
        </section>

        {/* 📊 Feedback Section */}
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>

          {feedback && feedback.ATS ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS
                 score={feedback.ATS.score}
                suggestions={feedback.ATS.suggestions}
              />

              <Details feedback={feedback} />
            </div>
          ) : (
            <div className="flex items-center justify-center mt-10">
              <img src="/images/resume-scan-2.gif" className="w-[200px]" />
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Resume;
