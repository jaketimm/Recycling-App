import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Box, Button, Center, Group, Loader,
  Modal, Paper, Stack, Text, Title,
} from '@mantine/core';
import { IconAlertTriangle, IconPhoto } from '@tabler/icons-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { submissionService } from '../services/submissionService';
import { SubmissionCard } from '../components/SubmissionCard';

export function SubmissionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const queryKey = ['submissions', user?.id];
  const submissions = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: () => submissionService.listSubmissions(user.id),
  });
  const deletion = useMutation({
    mutationFn: (submission) => submissionService.removeSubmission(submission, user.id),
    onSuccess: () => {
      setSelected(null);
      return queryClient.invalidateQueries({ queryKey });
    },
  });

  return (
    <Box style={{
      minHeight: 'calc(100vh - 56px)',
      padding: '25px', paddingTop: '50px', margin: '-16px', background: 'radial-gradient(circle at 15% 20%, #dbddd5 0%, #eaecea 55%)'
    }}>
      <Stack gap="xl" maw={1200} mx="auto">
        <Group justify="center">
          <Stack gap={4}>
            <Title order={2} ta="center">My submissions</Title>
            <Text >Your saved photos and identification results, newest first.</Text>
          </Stack>
        </Group>

        {submissions.isPending ? (
          <Center py="xl"><Loader aria-label="Loading submissions" /></Center>
        ) : submissions.isError ? (
          <Alert color="red" title="Could not load submissions" icon={<IconAlertTriangle size={18} />}>
            <Stack gap="sm">
              <Text size="sm">Please try again.</Text>
              <Button variant="light" color="#7e3a34" onClick={() => submissions.refetch()} loading={submissions.isFetching} w="fit-content">Retry</Button>
            </Stack>
          </Alert>
        ) : submissions.data.length === 0 ? (
          <Paper withBorder radius="md" p="xl">
            <Stack align="center" gap="sm" py="xl">
              <IconPhoto size={40} color="var(--mantine-color-dimmed)" />
              <Title order={3}>No submissions yet</Title>
              <Text c="dimmed" ta="center">Identify an item while signed in to save it here.</Text>
            </Stack>
          </Paper>
        ) : (
          <Group justify="center" gap="lg">
            {submissions.data.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onDelete={(item) => { deletion.reset(); setSelected(item); }}
              />
            ))}
          </Group>
        )}
      </Stack>

      <Modal opened={!!selected} onClose={() => { if (!deletion.isPending) setSelected(null); }}
        title="Delete submission?" centered closeOnClickOutside={!deletion.isPending}
        closeOnEscape={!deletion.isPending} withCloseButton={!deletion.isPending}>
        <Stack>
          <Text size="sm">This will permanently delete this submission and its photo.</Text>
          {deletion.isError && <Alert color="#7e3a34" title="Deletion failed">{deletion.error.message || 'Please try again.'}</Alert>}
          <Group justify="flex-start">
            <Button variant="default" disabled={deletion.isPending} onClick={() => setSelected(null)}>Cancel</Button>
            <Button color="#7e3a34" loading={deletion.isPending} onClick={() => deletion.mutate(selected)}>Delete submission</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}

