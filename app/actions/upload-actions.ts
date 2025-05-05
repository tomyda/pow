'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Example using local file system
export async function uploadProfilePicture(formData: FormData) {
  try {
    const file = formData.get('profilePicture') as File
    if (!file) {
      throw new Error('No file uploaded')
    }
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('File size too large (max 5MB)')
    }
    
    // Create unique filename
    const fileExt = path.extname(file.name)
    const fileName = `${uuidv4()}${fileExt}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    
    const filePath = path.join(uploadsDir, fileName)
    
    // Convert file to buffer and save
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filePath, buffer)
    
    // Save file path to database
    const publicPath = `/uploads/${fileName}`
    // await db.user.update({
    //   where: { id: userId },
    //   data: { profilePicture: publicPath }
    // })
    
    // Revalidate the path so the new image appears
    revalidatePath('/profile')
    
    return { success: true, path: publicPath }
  } catch (error) {
    console.error('Error uploading file:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}