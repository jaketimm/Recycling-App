import { Container, Title, Text, Button, Group, Stack, Box } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconCamera, IconLogin, IconLeaf } from '@tabler/icons-react';
import { useAuth } from '../../auth/hooks/useAuth';

export function LandingPage() {
  const { user } = useAuth();
  return (
    <Box
      style={{
        minHeight: 'calc(100vh - 56px)',
        margin: '-16px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container size="sm" py={80}>
        <Stack gap="lg" align="center" ta="center">
          <IconLeaf size={56} color="#737d51" stroke={1.5} />
          <Title order={1} c="#737d51" fw={800} style={{ fontSize: '2.75rem' }}>
            Recycle Smarter, Not Harder
          </Title>
          <Text c="black" size="lg" maw={520} opacity={0.9}>
            Snap a photo of an item and instantly find out if it's recyclable.
            Help keep waste out of landfills, one item at a time.
          </Text>
          <Group gap="md" mt="md">
            <Button
              component={Link}
              to="/identify"
              size="lg"
              radius="xl"
              variant="filled"
              leftSection={<IconCamera size={20} />}
            >
              Try it Out
            </Button>
            {user ? (
              <Button
                component={Link}
                to="/profile"
                size="lg"
                radius="xl"
                variant="light"
                leftSection={<IconLogin size={20} />}
              >
                Profile
              </Button>
            ) : (
              <Button
                component={Link}
                to="/login"
                size="lg"
                radius="xl"
                variant="light"
                leftSection={<IconLogin size={20} />}
              >
                Sign In
              </Button>
            )}
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}
