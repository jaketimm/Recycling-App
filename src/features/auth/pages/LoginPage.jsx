import { useState } from 'react';
import { Container, Title, Paper, Text, Anchor, Stack, Alert } from '@mantine/core';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { signInWithMagicLink, signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [linkSent, setLinkSent] = useState(false);
  const from = location.state?.from?.pathname ?? '/';

  const handleMagicLink = async ({ email }) => {
    await signInWithMagicLink(email);
    setLinkSent(true);
  };

  const handlePasswordLogin = async ({ email, password }) => {
    await signInWithPassword(email, password);
    navigate(from, { replace: true });
  };

  return (
    <Container size={420} py={60}>
      <Stack gap="xs" mb="lg">
        <Title order={2} ta="center">Recycling App</Title>
        <Text c="dimmed" size="sm" ta="center">
          <Anchor component={Link} to="/signup">Create an account</Anchor> to track and manage your photo history, or log in to continue.
        </Text>
      </Stack>
      <Paper withBorder shadow="md" p={30} radius="md">
        {linkSent ? (
          <Alert color="green" title="Check your email">
            We've sent you a sign-in link. Open it on this device to continue.
          </Alert>
        ) : (
          <AuthForm
            onMagicLink={handleMagicLink}
            onPassword={handlePasswordLogin}
            magicLinkLabel="Email me a sign-in link"
            passwordLabel="Log in"
          />
        )}
      </Paper>
    </Container>
  );
}