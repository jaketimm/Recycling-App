import { useState } from 'react';
import { Box, Container, Title, Paper, Text, Anchor, Stack, Alert } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';

export function SignUpPage() {
  const { signUpWithPassword } = useAuth();
  const navigate = useNavigate();
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  const handlePasswordSignUp = async ({ email, password, fullName }) => {
    const { session } = await signUpWithPassword(email, password, fullName);
    if (session) {
      navigate('/', { replace: true });
    } else {
      setConfirmEmailSent(true);
    }
  };

  return (
    <Box style={{
      height: '100vh',
      padding: '25px', margin: '-16px', background: 'radial-gradient(circle at 15% 20%, #eef1e6 0%, #fbfcfb 55%)'
    }}>
      <Container size={420} py={60}>
        <Stack gap="xs" mb="lg">
          <Title order={2} ta="center">Create an account</Title>
          <Text c="dimmed" size="sm" ta="center">
            Already have an account? <Anchor component={Link} to="/login">Log in</Anchor>
          </Text>
        </Stack>
        <Paper withBorder shadow="md" p={30} radius="md">
          {confirmEmailSent ? (
            <Alert color="green" title="Check your email">
              We've sent you a link to confirm your account.
            </Alert>
          ) : (
            <AuthForm onPassword={handlePasswordSignUp} passwordLabel="Sign up" withName />
          )}
        </Paper>
      </Container>
    </Box>
  );
}
