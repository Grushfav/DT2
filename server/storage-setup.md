# Supabase Storage Setup Guide

## Step 1: Create Storage Bucket in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Create a bucket named `images`
6. Set it to **Public** (so images can be accessed via URL)
7. Click **"Create bucket"**

## Step 2: Set Up Storage Policies (Optional but Recommended)

Run this SQL in your Supabase SQL Editor to set up proper access policies:

```sql
-- Allow public read access to images bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Allow authenticated users to upload (if you want user uploads)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow service role to do everything (for admin operations)
-- Note: Service role bypasses RLS, so admin operations will work regardless
```

## Step 3: Upload Images via API

### Using the Admin Panel
The admin panel now supports image uploads. When creating/editing packages, you can upload images directly.

### Using cURL (for testing)

```bash
curl -X POST http://localhost:4000/api/upload \
  -H "x-admin-key: secret-admin-key" \
  -F "image=@/path/to/your/image.jpg" \
  -F "bucket=images" \
  -F "folder=packages"
```

### Response
```json
{
  "url": "https://esmyslkskokkxfjolcto.supabase.co/storage/v1/object/public/images/packages/1234567890-abc123.jpg",
  "path": "packages/1234567890-abc123.jpg",
  "fileName": "1234567890-abc123.jpg"
}
```

## Step 4: Use Image URLs in Your Database

When creating packages, use the `url` from the upload response:

```json
{
  "code": "BT2-GRE-01",
  "title": "Greek Islands Escape",
  "img": "https://esmyslkskokkxfjolcto.supabase.co/storage/v1/object/public/images/packages/1234567890-abc123.jpg"
}
```

## Storage Structure

```
images/
├── packages/
│   ├── package-1.jpg
│   ├── package-2.jpg
│   └── ...
├── deals/
│   ├── deal-1.jpg
│   └── ...
└── avatars/
    └── ...
```

## API Endpoints

- `POST /api/upload` - Upload an image (requires admin auth)
  - Body: `multipart/form-data` with `image` file
  - Query params: `bucket` (default: 'images'), `folder` (default: 'packages')
  
- `GET /api/images` - List images (requires admin auth)
  - Query params: `bucket` (default: 'images'), `folder` (default: 'packages')
  
- `DELETE /api/images` - Delete an image (requires admin auth)
  - Body: `{ "bucket": "images", "path": "packages/image.jpg" }`

## File Size Limits

- Default limit: 10MB per file
- Can be adjusted in `server/index.js` (multer limits)

## Best Practices

1. **Organize by folder**: Use folders like `packages/`, `deals/`, `avatars/`
2. **Use descriptive names**: Include timestamp or UUID in filename to avoid conflicts
3. **Optimize images**: Compress images before uploading for better performance
4. **CDN**: Supabase Storage automatically serves via CDN for fast delivery

