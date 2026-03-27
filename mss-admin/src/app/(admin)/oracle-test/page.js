"use client";

import { useState } from "react";

export default function OracleTestPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResultUrl("");
    setErrorMsg("");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Url = reader.result;
        
        const res = await fetch("/api/v1/oracle-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            fileBase64: base64Url, 
            mimeType: file.type,
            originalName: file.name
          }),
        });

        const data = await res.json();
        
        if (res.ok) {
          setResultUrl(data.url);
        } else {
          setErrorMsg(data.error || "Upload failed");
        }
        setLoading(false);
      };
      reader.onerror = () => {
        setErrorMsg("Failed to read file");
        setLoading(false);
      };

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto mt-10 bg-white rounded-2xl shadow-sm border border-slate-100">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Test Oracle Object Storage</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select an Image (max 2MB recommended for base64 test)</label>
        <input 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition disabled:opacity-50"
      >
        {loading ? "Uploading to Oracle..." : "Upload File"}
      </button>

      {errorMsg && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
           Error: {errorMsg}
           <br/>
           <span className="text-xs text-red-500 mt-2 block">Make sure your OCI ENV variables are correctly set in .env</span>
        </div>
      )}

      {resultUrl && (
        <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
           <h3 className="text-green-800 font-semibold mb-2">Upload Success! 🎉</h3>
           <p className="text-xs text-green-700 break-all mb-4">{resultUrl}</p>
           <a href={resultUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">View uploaded image</a>
           <div className="mt-4">
              <img src={resultUrl} alt="Uploaded test" className="max-w-full rounded-lg shadow-sm" />
           </div>
        </div>
      )}
    </div>
  );
}
