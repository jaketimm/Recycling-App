import { useState } from 'react';
import { TextInput, PasswordInput, Button, Stack, Alert, SegmentedControl } from '@mantine/core';
import { useForm } from '@mantine/form';

export function AuthForm({ onMagicLink, onPassword, magicLinkLabel, passwordLabel, withName = false }) {
  const [mode, setMode] = useState('magic');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { email: '', fullName: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Invalid email'),
      fullName: (v) => (withName && v.trim().length < 2 ? 'Name is required' : null),
      password: (v) => (mode === 'password' && v.length < 8 ? 'Password must be at least 8 characters' : null),
    },
  });

  const handleSubmit = async (values) => {
    setError(null);
    setLoading(true);
    try {
      await (mode === 'magic' ? onMagicLink(values) : onPassword(values));
    } catch (err) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        {error && <Alert color="red" title="Error">{error}</Alert>}
        <SegmentedControl
          fullWidth
          value={mode}
          onChange={setMode}
          data={[
            { label: 'Magic link', value: 'magic' },
            { label: 'Password', value: 'password' },
          ]}
        />
        {withName && (
          <TextInput label="Username" placeholder="Jane Doe" required {...form.getInputProps('fullName')} />
        )}
        <TextInput label="Email" placeholder="you@example.com" required {...form.getInputProps('email')} />
        {mode === 'password' && (
          <PasswordInput
            label="Password"
            placeholder="At least 8 characters"
            required
            {...form.getInputProps('password')}
          />
        )}
        <Button type="submit" loading={loading} fullWidth mt="sm">
          {mode === 'magic' ? magicLinkLabel : passwordLabel}
        </Button>
      </Stack>
    </form>
  );
}
