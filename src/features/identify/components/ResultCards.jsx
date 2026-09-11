import {
  Alert, Anchor, Badge, Card, Divider, Group,
  Paper, Progress, Stack, Text, ThemeIcon,
} from '@mantine/core';
import {
  IconCircleCheck, IconCircleX, IconExternalLink, IconRecycle,
} from '@tabler/icons-react';


// Shows a placeholder card when the image hasn't been submitted yet, or while the image is being analyzed.
export function PlaceholderResultCard({ loading }) {
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


// Displays the result of the image analysis, including whether the item is recyclable, confidence level, and any additional instructions or information.
export function ResultCard({ result, linkDisabled = false }) {
  const {
    contains_recyclable_item, material_type, item_description, confidence,
    unidentified_reason, category, display_name, is_recyclable, instructions,
    source_url, saved,
  } = result;

  if (!contains_recyclable_item) {
    return (
      <Card withBorder radius="md" p="md" style={{ flex: 1 }}>
        <Alert color="gray" title="No recyclable item found" icon={<IconCircleX size={18} />}>
          {unidentified_reason || "We couldn't identify a recyclable item in this photo. Try a clearer or closer photo."}
        </Alert>
      </Card>
    );
  }

  const recyclable = Boolean(is_recyclable);
  const confidencePercent = typeof confidence === 'number' ? Math.round(confidence * 100) : null;

  return (
    <Card withBorder radius="md" p="md" style={{ flex: 1 }}>
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={40} radius="xl" color={recyclable ? 'GreenColors' : '#7e3a34'} variant="light">
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
          {saved && <Badge color="#4b5232">Saved</Badge>}
        </Group>

        <Badge color={recyclable ? 'GreenColors' : '#7e3a34'} variant="filled" w="fit-content">
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
            <Progress value={confidencePercent} color={recyclable ? 'GreenColors' : '#7e3a34'} radius="xl" />
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

        {/* Include an earth911 page link for select materials */}
        {source_url && (
          linkDisabled ? (
            <Group gap={4}>
              <Text size="sm">
                Learn more
              </Text>
              <IconExternalLink size={14} />
            </Group>
          ) : (
            <Anchor href={source_url} target="_blank" rel="noopener noreferrer" size="sm">
              <Group gap={4}>
                Learn more
                <IconExternalLink size={14} />
              </Group>
            </Anchor>
          ))}
      </Stack>
    </Card>
  );
}
