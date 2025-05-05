"use client"

import { useState } from "react"
import { uploadProfilePicture } from "@/app/actions/upload-actions"

export default function ProfilePictureUpload() {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  
  async function handleSubmit(formData: FormData) {
    setUploading(true)
    try {
      const result = await uploadProfilePicture(formData)
      // You could update UI based on result
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }
  
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
    }
  }
  
  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Update Profile Picture</h2>
      
      {preview && (
        <div className="mb-4">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-24 h-24 object-cover rounded-full mx-auto"
          />
        </div>
      )}
      
      <form action={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Select image
          </label>
          <input
            type="file"
            name="profilePicture"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full border rounded p-2"
          />
        </div>
        
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Picture"}
        </button>
      </form>
    </div>
  )
}