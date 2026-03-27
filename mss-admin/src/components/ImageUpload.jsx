"use client";

import { useState } from "react";

export default function ImageUpload({ onUploadComplete, initialUrl = "", label = "Upload Image" }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      await handleUpload(selectedFile);
    }
  };

  const handleUpload = async (selectedFile) => {
    setLoading(true);
    setErrorMsg("");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64Url = reader.result;
        
        const res = await fetch("/api/v1/oracle-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            fileBase64: base64Url, 
            mimeType: selectedFile.type,
            originalName: selectedFile.name
          }),
        });

        const data = await res.json();
        
        if (res.ok) {
          setUrl(data.url);
          if (onUploadComplete) onUploadComplete(data.url);
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
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      
      <div className="flex items-start gap-4">
        {url && (
          <div className="w-24 h-24 relative rounded overflow-hidden border">
            <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="flex-1">
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          {loading && <p className="text-xs text-blue-600 mt-2">Uploading...</p>}
          {errorMsg && <p className="text-xs text-red-600 mt-2">{errorMsg}</p>}
        </div>
      </div>
    </div>
  );
}
