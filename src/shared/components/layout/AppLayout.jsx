import {
  AppShell,
  Burger,
  Group,
  Title,
  Button,
  NavLink,
  ScrollArea,
  Text,
  Stack,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconLogout, IconLayoutDashboard, IconCamera, IconHome } from '@tabler/icons-react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useProfile } from '../../../features/profile/hooks/useProfile';

const NAV_SECTIONS = [
  {
    adminOnly: false,
    links: [{ label: 'Home', to: '/landing', icon: IconHome }],
  },
  {
    label: 'Images',
    adminOnly: false,
    links: [{ label: 'Identify', to: '/identify', icon: IconCamera }],
  },
  {
    label: 'Manage',
    adminOnly: true,
    links: [{ label: 'Dashboard', to: '/admin', icon: IconLayoutDashboard }],
  },
];

export function AppLayout() {
  const [opened, { toggle, close }] = useDisclosure();
  const { signOut, user } = useAuth();
  const { isAdmin } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();

  const sections = NAV_SECTIONS.filter((s) => !s.adminOnly || isAdmin);


  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" style={{ background: '#4b5232' }}>
          <Group gap="sm">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Title
              order={4}
              component={Link}
              to="/"
              style={{ textDecoration: 'none', color: '#ebece6' }}
            >
              Recycling ID
            </Title>
          </Group>
          <Group gap="md">
            {user ? (
              <>
                <Text size="sm" c="#ebece6" visibleFrom="sm">
                  {user.email}
                </Text>
                <Button
                  onClick={handleSignOut}
                  variant="light"
                  size="xs"
                  leftSection={<IconLogout size={16} />}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button component={Link} to="/login" variant="light" size="xs">
                  Log In
                </Button>
                <Button component={Link} to="/signup" variant="light" size="xs">
                  Sign Up
                </Button>
              </>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <AppShell.Section grow component={ScrollArea}>
          <Stack gap="lg">
            {sections.map((section) => (
              <div key={section.label}>
                <Text
                  size="xs"
                  fw={700}
                  c="dimmed"
                  tt="uppercase"
                  px="xs"
                  mb={4}
                >
                  {section.label}
                </Text>
                {section.links.map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={to}
                    component={Link}
                    to={to}
                    label={label}
                    active={isActive(to)}
                    variant={isActive(to) ? 'light' : 'subtle'}
                    onClick={close}
                    leftSection={<Icon size={18} stroke={1.5} />}
                    style={{
                      borderRadius: 'var(--mantine-radius-sm)',
                    }}
                  />
                ))}
              </div>
            ))}
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}