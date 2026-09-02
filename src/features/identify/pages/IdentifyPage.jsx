import { useState } from 'react';
import {
  Alert, Anchor, Badge, Button, Card, Divider, FileInput, Group,
  Image, Paper, Progress, Stack, Text, ThemeIcon, Title,
} from '@mantine/core';
import {
  IconAlertTriangle, IconCircleCheck, IconCircleX, IconExternalLink, IconPhoto, IconRecycle,
} from '@tabler/icons-react';
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
    <Stack gap="lg" maw={960} mx="auto" align="center">
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

          {result && <ResultCard result={result} />}

          {!error && !result && <PlaceholderResultCard loading={loading} />}
        </div>
      </Group>
    </Stack>
  );
}

function PlaceholderResultCard({ loading }) {
  return (
    <Paper withBorder radius="md" p="md" style={{ borderStyle: 'dashed', flex: 1 }}>
      <Stack align="center" justify="center" gap="xs" h="100%" py="xl">
        <ThemeIcon size={40} radius="xl" color="gray" variant="light">
          <IconRecycle size={22} />
        </ThemeIcon>
        <Text c="dimmed" size="sm" ta="center">
          {loading ? 'Analyzing your photo…' : 'Your result will appear here once you identify an item.'}
        </Text>
      </Stack>
    </Paper>
  );
}

function ResultCard({ result }) {
  const {
    contains_recyclable_item, material_type, item_description, confidence,
    unidentified_reason, category, display_name, is_recyclable, instructions,
    source_url, saved,
  } = result;

  if (!contains_recyclable_item) {
    return (
      <Alert color="gray" title="No recyclable item found" icon={<IconCircleX size={18} />}>
        {unidentified_reason || "We couldn't identify a recyclable item in this photo. Try a clearer or closer photo."}
      </Alert>
    );
  }

  const recyclable = Boolean(is_recyclable);
  const confidencePercent = typeof confidence === 'number' ? Math.round(confidence * 100) : null;

  return (
    <Card withBorder radius="md" p="md" style={{ flex: 1 }}>
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={40} radius="xl" color={recyclable ? 'green' : 'red'} variant="light">
              {recyclable ? <IconRecycle size={22} /> : <IconCircleX size={22} />}
            </ThemeIcon>
            <div>
              <Text fw={600} size="lg">
                {display_name || item_description || 'Unknown item'}
              </Text>
              {category && (
                <Text c="dimmed" size="sm" tt="capitalize">
                  {category.replace(/_/g, ' ')}
                </Text>
              )}
            </div>
          </Group>
          {saved && <Badge color="blue" variant="light">Saved</Badge>}
        </Group>

        <Badge color={recyclable ? 'green' : 'red'} variant="filled" w="fit-content">
          {recyclable ? 'Recyclable' : 'Not generally recyclable'}
        </Badge>

        {item_description && material_type.toLowerCase() !== display_name.toLowerCase() && (
          <Text size="sm" c="dimmed">
            Description: {item_description}
          </Text>
        )}

        {confidencePercent !== null && (
          <Stack gap={4}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Confidence
              </Text>
              <Text size="sm" c="dimmed">
                {confidencePercent}%
              </Text>
            </Group>
            <Progress value={confidencePercent} color={recyclable ? 'green' : 'red'} radius="xl" />
          </Stack>
        )}

        {instructions && (
          <>
            <Divider />
            <Stack gap={4}>
              <Group gap={6}>
                <IconCircleCheck size={16} />
                <Text fw={500} size="sm">
                  Recycling Facts
                </Text>
              </Group>
              <Text size="sm">{instructions}</Text>
            </Stack>
          </>
        )}

        {source_url && (
          <Anchor href={source_url} target="_blank" rel="noopener noreferrer" size="sm">
            <Group gap={4}>
              Learn more
              <IconExternalLink size={14} />
            </Group>
          </Anchor>
        )}
      </Stack>
    </Card>
  );
}
