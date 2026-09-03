import { useState } from 'react';
import { Container, Title, Paper, Text, Anchor, Stack, Alert } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';

export function SignUpPage() {
  const { signInWithMagicLink, signUpWithPassword } = useAuth();
  const navigate = useNavigate();
  const [linkSent, setLinkSent] = useState(false);

  const handleMagicLink = async ({ email, fullName }) => {
    await signInWithMagicLink(email, fullName);
    setLinkSent(true);
  };

  const handlePasswordSignUp = async ({ email, password, fullName }) => {
    const { session } = await signUpWithPassword(email, password, fullName);
    if (session) {
      navigate('/', { replace: true });
    } else {
      setLinkSent(true);
    }
  };

  return (
    <Container size={420} py={60}>
      <Stack gap="xs" mb="lg">
        <Title order={2} ta="center" c="#737d51">Create an account</Title>
        <Text c="dimmed" size="sm" ta="center">
          Already have an account? <Anchor component={Link} to="/login">Log in</Anchor>
        </Text>
      </Stack>
      <Paper withBorder shadow="md" p={30} radius="md">
        {linkSent ? (
          <Alert color="green" title="Check your email">
            We've sent you a link to finish creating your account.
          </Alert>
        ) : (
          <AuthForm
            onMagicLink={handleMagicLink}
            onPassword={handlePasswordSignUp}
            magicLinkLabel="Email me a sign-in link"
            passwordLabel="Sign up"
            withName
          />
        )}
      </Paper>
    </Container>
  );
}
