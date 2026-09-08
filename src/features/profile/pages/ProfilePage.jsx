import { useEffect, useState } from 'react';
import {
  Container, Title, Paper, Stack, TextInput, Button, Text, Center, Loader, Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useProfile } from '../hooks/useProfile';
import { profileService } from '../services/profileService';

export function ProfilePage() {
  const { profile, isLoading, setProfile } = useProfile();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      username: '',
    },
    validate: {
      username: (v) => (v.trim().length >= 3 ? null : 'Username must be at least 3 characters'),
    },
  });

  // form mounts before the profile query resolves, so sync values once loaded
  useEffect(() => {
    if (profile) {
      form.setValues({ username: profile.username ?? '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (isLoading) {
    return <Center py="xl"><Loader /></Center>;
  }

  if (!profile) {
    return (
      <Center py="xl">
        <Text c="dimmed">No profile found for this account.</Text>
      </Center>
    );
  }

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const updated = await profileService.updateProfile(profile.id, {
        username: values.username.trim(),
      });
      setProfile(updated);
      notifications.show({ color: '#737d51', message: 'Profile updated' });
    } catch (err) {
      notifications.show({ color: '#7e3a34', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{
      minHeight: 'calc(100vh - 56px)',
      display: 'flex',
      justifyContent: 'center',
      padding: '25px', margin: '-16px', background: 'radial-gradient(circle at 15% 20%, #eef1e6 0%, #fbfcfb 55%)'
    }}>
      <Container size="sm" py="xl" style={{ width: '100%', maxWidth: '450px' }}>
        <Title order={2} mb="lg" ta="center">My Profile</Title>
        <Paper withBorder p="lg" radius="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput label="Username" required {...form.getInputProps('username')} />
              <Text size="xs" c="dimmed">
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </Text>
              <Button type="submit" loading={loading}>Save changes</Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}