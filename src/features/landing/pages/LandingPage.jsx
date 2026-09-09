import {
  Container, Title, Text, Button, Group, Stack, Box, Paper, SimpleGrid, 
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Link } from 'react-router-dom';
import { IconCamera, IconLogin} from '@tabler/icons-react';
import { ResultCard } from '../../identify/components/ResultCards';
import { useAuth } from '../../auth/hooks/useAuth';


export function LandingPage() {
  const { user } = useAuth();
  const isNarrow = useMediaQuery('(max-width: 1000px)');
  return (
    <Box style={{ margin: '-16px' }}>
      <Box
        style={{
          minHeight: 'calc(100vh - 56px)',
          display: 'flex',
          alignItems: 'center',
          padding: '35px',
          background: 'radial-gradient(circle at 15% 20%, #eef1e6 0%, #fbfcfb 55%)',
        }}
      >
        <Container size="lg" py={80}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60} verticalSpacing={40}>
            <Stack gap="lg" justify="center">
              <Title order={1} c="black" fw={800} style={{ fontSize: '2.75rem', lineHeight: 1.1 }}>
                Know if it's recyclable before you toss it
              </Title>
              <Text c="dimmed" size="lg" maw={480}>
                Snap a photo of any item and get a fast, material-specific
                answer. 
              </Text>
              <Group gap="md" mt="sm">
                <Button component={Link} to="/identify" size="lg" radius="xl" variant="filled" leftSection={<IconCamera size={20} />}>
                  Try it Out
                </Button>
                {user ? (
                  <Button component={Link} to="/profile" size="lg" radius="xl" variant="light" leftSection={<IconLogin size={20} />}>
                    Profile
                  </Button>
                ) : (
                  <Button component={Link} to="/login" size="lg" radius="xl" variant="light" leftSection={<IconLogin size={20} />}>
                    Sign In
                  </Button>
                )}
              </Group>
            </Stack>

            <Paper style={{ alignSelf: 'center', justifySelf: isNarrow ? 'flex-start' : 'flex-end', maxWidth: '450px' }}>
              <Stack gap="sm">
                <ResultCard
                  result={{
                    contains_recyclable_item: true,
                    is_recyclable: true,
                    display_name: 'Carton',
                    item_description: 'Carton',
                    material_type: 'Carton',
                    category: 'Paper',
                    confidence: 1,
                    instructions: 'Often accepted curbside. Empty and rinse first. See the linked guide for local acceptance.',
                    source_url: 'https://earth911.com/recycling-guide/how-to-recycle-carton/',
                  }}
                  linkDisabled={true}
                />
              </Stack>
            </Paper>
          </SimpleGrid>
        </Container>
      </Box>
    </Box>
  );
}