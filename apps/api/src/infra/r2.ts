import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(options: {
  key: string
  body: Buffer
  contentType: string
  visibility?: 'public' | 'private'
}): Promise<{ key: string; url?: string; bucket: string }> {
  const bucket = options.visibility === 'public'
    ? process.env.R2_BUCKET_NAME!
    : process.env.R2_PRIVATE_BUCKET_NAME || process.env.R2_BUCKET_NAME!

  await r2.send(new PutObjectCommand({
    Bucket: bucket,
    Key: options.key,
    Body: options.body,
    ContentType: options.contentType,
  }))

  const url = options.visibility === 'public'
    ? `${process.env.R2_PUBLIC_URL}/${options.key}`
    : undefined

  return { key: options.key, url, bucket }
}

export async function getSignedR2Url(key: string, bucket: string): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 60 * 15 },
  )
}

export async function deleteFromR2(key: string, bucket?: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({
    Bucket: bucket || process.env.R2_BUCKET_NAME,
    Key: key,
  }))
}
