const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Upload a file to Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket (e.g., 'packages/image.jpg')
 * @param {Buffer|File} file - File buffer or File object
 * @param {object} options - Upload options
 * @returns {Promise<{url: string, path: string}>}
 */
async function uploadFile(bucket, path, file, options = {}) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options.contentType || 'image/jpeg',
      upsert: options.upsert || true,
      ...options
    })

  if (error) {
    console.error('Upload error:', error)
    throw error
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    path: data.path
  }
}

/**
 * Delete a file from Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 */
async function deleteFile(bucket, path) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    console.error('Delete error:', error)
    throw error
  }
}

/**
 * Get public URL for a file
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @returns {string} Public URL
 */
function getPublicUrl(bucket, path) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  return data.publicUrl
}

/**
 * List files in a bucket folder
 * @param {string} bucket - Storage bucket name
 * @param {string} folder - Folder path (optional)
 * @returns {Promise<Array>} List of files
 */
async function listFiles(bucket, folder = '') {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder)

  if (error) {
    console.error('List error:', error)
    throw error
  }

  return data || []
}

module.exports = {
  uploadFile,
  deleteFile,
  getPublicUrl,
  listFiles
}

