import { useState } from 'react';
import { Anchor, Badge, Button, Card, Center, Group, Image, Stack, Text, Title } from '@mantine/core';
import { IconPhoto, IconTrash } from '@tabler/icons-react';



function SubmissionImage({ submission, name }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <Center h={200} bg="gray.0">
      <Stack align="center" gap="xs" c="dimmed">
        <IconPhoto size={32} />
        <Text size="sm">Image unavailable</Text>
      </Stack>
    </Center>
  ) : (
    <Image src={submission.image_url} alt={name} h={200} w="90%" fit="cover" mx="auto"
     loading="lazy" onError={() => setFailed(true)} />
  );
}

export function SubmissionCard({ submission, onDelete }) {
  const name = submission.material?.display_name || submission.material_type?.replaceAll('_', ' ') || 'Unidentified item';
  const recyclable = submission.material?.is_generally_recyclable;

  return (
    <Card withBorder radius="md" padding="md" w={{ base: '100%', xs: 340 }} maw={400} h={500} style={{ overflow: 'hidden' }}>
      <Card.Section pt="md" style={{ overflow: 'hidden' }}><SubmissionImage submission={submission} name={name} /></Card.Section>
      <Stack gap="sm" mt="md" style={{ flex: 1 }}>
        <Badge color={recyclable === true ? 'GreenColors' : recyclable === false ? '#7e3a34' : 'gray'} variant="light">
          {recyclable === true ? 'Recyclable' : recyclable === false ? 'Not generally recyclable' : 'Recyclability unknown'}
        </Badge>
        <div>
          <Text size="xs" c="dimmed">Identified as</Text>
          <Title order={3} size="h4">{name}</Title>
        </div>
        {submission.material?.instructions && <Text size="sm" lineClamp={3}> <b>Instructions:</b> {submission.material.instructions}</Text>}
        {submission.material?.source_url && (
          <Anchor href={submission.material.source_url} target="_blank" rel="noopener noreferrer" size="sm">
            Learn more
          </Anchor>
        )}
        <Group justify="space-between" mt="auto" pt="sm">
          <Text size="xs" c="dimmed">{new Date(submission.created_at).toLocaleDateString()}</Text>
          <Button variant="subtle" color="#7e3a34" size="xs" leftSection={<IconTrash size={16} />}
            aria-label={`Delete ${name}`} onClick={() => onDelete(submission)}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}

