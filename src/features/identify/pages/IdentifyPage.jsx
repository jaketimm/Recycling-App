import { useState } from 'react';
import {
  Alert, Box, Button, FileInput, Group,
  Image, Paper, Stack, Text, Title,
} from '@mantine/core';
import {
  IconAlertTriangle, IconPhoto,
} from '@tabler/icons-react';
import { ResultCard, PlaceholderResultCard } from '../components/ResultCards';
import { resizeImageToBase64 } from '../utils/resizeImageToBase64';
import { supabase } from '../../../lib/supabaseClient';

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
    <Box style={{
      minHeight: 'calc(100vh - 56px)',
      display: 'flex',
      padding: '25px', paddingTop: '50px', margin: '-16px', background: 'radial-gradient(circle at 15% 20%, #eef1e6 0%, #fbfcfb 55%)'
    }}>

      <Stack gap="lg" maw={960} mx="auto" align="center" >
        <Stack gap={4} align="center">
          <Title order={2}>Identify your item</Title>
          <Text c="dimmed">Upload a photo to identify whether your item is recyclable.</Text>
        </Stack>

        <Group align="flex-start" justify="center" wrap="wrap" gap="lg">
          <Paper withBorder radius="md" p="md" w={375} h={400}>
            <Stack gap="md" h="100%">
              <FileInput
                label="Item photo"
                placeholder="Choose an image"
                accept="image/*"
                value={file}
                onChange={handleFileChange}
                leftSection={<IconPhoto size={16} />}
                clearable
              />

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
                {previewUrl ? (
                  <Image src={previewUrl} alt="Preview" radius="sm" mah="100%" fit="contain" />
                ) : (
                  <Text c="dimmed" size="sm">
                    No image selected
                  </Text>
                )}
              </div>

              <Group justify="center">
                <Button onClick={handleSubmit} disabled={!file || loading} loading={loading}>
                  Identify
                </Button>
              </Group>
            </Stack>
          </Paper>

          <div style={{ width: 375, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
            {error && (
              <Alert color="red" title="Error" icon={<IconAlertTriangle size={18} />} style={{ flex: 1 }}>
                {error}
              </Alert>
            )}

            {result && <ResultCard result={result} linkDisabled={false} />}

            {!error && !result && <PlaceholderResultCard loading={loading} />}
          </div>
        </Group>
      </Stack>
    </Box>
  );
}

