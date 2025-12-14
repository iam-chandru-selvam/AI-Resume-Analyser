import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { ref, listAll, deleteObject } from "firebase/storage";

import { auth, db, storage } from "~/lib/firebase";

const WipeApp = () => {
  const [files, setFiles] = useState<any[]>([]);

  const loadFiles = async () => {
    const user = auth.currentUser;
    if (!user) return; // root.tsx already handled redirect

    const folderRef = ref(storage, `resumes/${user.uid}`);
    const result = await listAll(folderRef);
    setFiles(result.items);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDelete = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // 🔥 Delete Firestore documents
    const q = query(
      collection(db, "resumes"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));

    // 🔥 Delete Storage files
    const folderRef = ref(storage, `resumes/${user.uid}`);
    const result = await listAll(folderRef);
    await Promise.all(result.items.map((file) => deleteObject(file)));

    loadFiles();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Wipe My Data</h2>

      <div className="mt-4">
        <p className="font-semibold">Stored files:</p>
        {files.length === 0 && <p>No files found</p>}
        {files.map((file) => (
          <p key={file.fullPath}>{file.name}</p>
        ))}
      </div>

      <button
        className="bg-red-600 text-white px-4 py-2 rounded-md mt-6"
        onClick={handleDelete}
      >
        Wipe My App Data
      </button>
    </div>
  );
};

export default WipeApp;