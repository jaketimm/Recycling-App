import { useState } from 'react';
import { Alert, Badge, Button, Code, FileInput, Group, Image, Loader, Stack, Text, Title } from '@mantine/core';
import { supabase } from '../../../lib/supabaseClient';

const MAX_EDGE_PX = 1024;
const JPEG_QUALITY = 0.85;

// Downscales to a max long edge and re-encodes as JPEG to cut Gemini token cost.
function resizeImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      URL.revokeObjectURL(img.src);
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function IdentifyPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function handleFileChange(selectedFile) {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setPreviewUrl(selectedFile ? URL.createObjectURL(selectedFile) : null);
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const image = await resizeImageToBase64(file);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (session) headers.Authorization = `Bearer ${session.access_token}`;

      const response = await fetch(`${apiUrl}/api/identify`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ image, mimeType: 'image/jpeg' }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Identification failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap="md" maw={480}>
      <Title order={2}>Identify your item</Title>
      <Text c="dimmed">Upload a photo to identify whether your item is recyclable.</Text>

      <FileInput label="Item photo" placeholder="Choose an image" accept="image/*" value={file} onChange={handleFileChange} />

      {previewUrl && <Image src={previewUrl} alt="Preview" radius="sm" mah={300} fit="contain" />}

      <Group>
        <Button onClick={handleSubmit} disabled={!file || loading}>
          Identify
        </Button>
        {loading && <Loader size="sm" />}
      </Group>

      {error && <Alert color="red" title="Error">{error}</Alert>}

      {result && (
        <Stack gap="xs">
          <Group gap="xs">
            <Text fw={500}>Result</Text>
            {result.saved && <Badge color="green">Saved to your log</Badge>}
          </Group>
          <Code block>{JSON.stringify(result, null, 2)}</Code>
        </Stack>
      )}
    </Stack>
  );
}
