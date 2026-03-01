// Test script for the caption pipeline API
// Run with: NODE_TLS_REJECT_UNAUTHORIZED=0 node test-api.mjs

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6Im44V3N5bkJvOGJoVkxrb1kiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3FpaHNnbmZqcW1ram1vb3d5ZmJuLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3NmFlNmU2Yy1lNTg2LTQ0OTktYjU1NC1lMWVmZTVhODJjZmEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcyMzk3MjI3LCJpYXQiOjE3NzIzOTM2MjcsImVtYWlsIjoiZWEzMDQ4QGNvbHVtYmlhLmVkdSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS1hocVhCRDdRODh1R3pWNnlEelR4OEFRTWtKaDhCOWQ4VkN5d1NBN1NTdmxvakVnPXM5Ni1jIiwiY3VzdG9tX2NsYWltcyI6eyJoZCI6ImNvbHVtYmlhLmVkdSJ9LCJlbWFpbCI6ImVhMzA0OEBjb2x1bWJpYS5lZHUiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiRW1pbGUgQWwtQmlsbGVoIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6IkVtaWxlIEFsLUJpbGxlaCIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0tYaHFYQkQ3UTg4dUd6VjZ5RHpUeDhBUU1rSmg4QjlkOFZDeXdTQTdTU3Zsb2pFZz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTE3MTQxOTg5ODk1OTM2MDk2Njk0Iiwic3ViIjoiMTE3MTQxOTg5ODk1OTM2MDk2Njk0In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib2F1dGgiLCJ0aW1lc3RhbXAiOjE3NzIzOTM2Mjd9XSwic2Vzc2lvbl9pZCI6Ijc2MzhjMmU4LTFhOTMtNGE1Yi1hMjdhLWU0MWNmYWUyZDc1MiIsImlzX2Fub255bW91cyI6ZmFsc2V9.OvlqiXMERLc5BX5NczDskZC51oyCAVfi0Zne5Tgk15o';

const API_BASE = 'https://api.almostcrackd.ai';

// Supabase client to check database
const supabase = createClient(
  'https://qihsgnfjqmkjmoowyfbn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpaHNnbmZqcW1ram1vb3d5ZmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1Mjc0MDAsImV4cCI6MjA2NTEwMzQwMH0.c9UQS_o2bRygKOEdnuRx7x7PeSf_OUGDtf9l3fMqMSQ'
);

async function step1_generatePresignedUrl(contentType) {
  console.log('\n=== STEP 1: Generate Presigned URL ===');
  
  const res = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ contentType })
  });

  console.log('Status:', res.status);
  if (!res.ok) {
    console.log('Error:', await res.text());
    return null;
  }
  
  const data = await res.json();
  console.log('presignedUrl:', data.presignedUrl?.substring(0, 100) + '...');
  console.log('cdnUrl:', data.cdnUrl);
  
  return data;
}

async function step2_uploadImage(presignedUrl, imageBuffer, contentType) {
  console.log('\n=== STEP 2: Upload Image to Presigned URL ===');
  
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType
    },
    body: imageBuffer
  });

  console.log('Status:', res.status);
  if (!res.ok) {
    console.log('Error:', await res.text());
    return false;
  }
  
  console.log('✅ Image uploaded successfully');
  return true;
}

async function step3_registerImage(cdnUrl) {
  console.log('\n=== STEP 3: Register Image URL ===');
  
  const res = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false })
  });

  console.log('Status:', res.status);
  if (!res.ok) {
    console.log('Error:', await res.text());
    return null;
  }
  
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  return data;
}

async function step4_generateCaptions(imageId) {
  console.log('\n=== STEP 4: Generate Captions ===');
  console.log('(This may take a while...)');
  
  const res = await fetch(`${API_BASE}/pipeline/generate-captions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ imageId })
  });

  console.log('Status:', res.status);
  const text = await res.text();
  
  try {
    const data = JSON.parse(text);
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch {
    console.log('Response (raw):', text);
    return text;
  }
}

async function checkDatabase(imageId) {
  console.log('\n=== CHECKING DATABASE ===');
  
  // Check if image exists in database
  const { data: image, error: imgErr } = await supabase
    .from('images')
    .select('*')
    .eq('id', imageId)
    .single();
  
  if (image) {
    console.log('✅ Image found in DB:', JSON.stringify(image, null, 2));
  } else {
    console.log('❌ Image NOT in DB:', imgErr?.message);
  }
  
  // Check if captions exist for this image
  const { data: captions, error: capErr } = await supabase
    .from('captions')
    .select('*')
    .eq('image_id', imageId);
  
  if (captions && captions.length > 0) {
    console.log(`✅ Found ${captions.length} captions in DB:`);
    captions.forEach((c, i) => {
      console.log(`  ${i + 1}. "${c.content}" (is_public: ${c.is_public})`);
    });
  } else {
    console.log('❌ No captions in DB for this image:', capErr?.message || 'empty result');
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('TESTING CAPTION PIPELINE API');
  console.log('='.repeat(60));
  
  // Download a test image
  console.log('\nDownloading test image...');
  const testImageUrl = 'https://picsum.photos/400/300.jpg';
  const imgRes = await fetch(testImageUrl);
  const imageBuffer = Buffer.from(await imgRes.arrayBuffer());
  console.log('Downloaded test image:', imageBuffer.length, 'bytes');
  
  // Step 1
  const step1Result = await step1_generatePresignedUrl('image/jpeg');
  if (!step1Result) return;
  
  // Step 2
  const uploadSuccess = await step2_uploadImage(
    step1Result.presignedUrl, 
    imageBuffer, 
    'image/jpeg'
  );
  if (!uploadSuccess) return;
  
  // Step 3
  const step3Result = await step3_registerImage(step1Result.cdnUrl);
  if (!step3Result) return;
  
  const imageId = step3Result.imageId;
  console.log('\n📌 Image ID:', imageId);
  
  // Step 4
  const captions = await step4_generateCaptions(imageId);
  
  // Check database
  await checkDatabase(imageId);
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

main().catch(console.error);
