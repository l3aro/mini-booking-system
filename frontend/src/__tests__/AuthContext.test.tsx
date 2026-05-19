import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const { login, logout } = vi.hoisted(() => ({
  login: vi.fn().mockResolvedValue({ token: 'test', user: { id: 1, name: 'Test', email: 't@t.com', is_admin: false } }),
  logout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('/src/lib/api.ts');
  return {
    ...actual,
    default: actual.default,
    login,
    logout,
  };
});

function Consumer() {
  const { user, token, isAuthenticated, loginUser, logoutUser } = useAuth();
  return (
    <div>
      <div data-testid="user-name">{user?.name ?? 'none'}</div>
      <div data-testid="token">{token ?? 'none'}</div>
      <div data-testid="auth-state">{String(isAuthenticated)}</div>
      <button type="button" onClick={() => loginUser('a@test.com', 'secret')} data-testid="do-login">
        login
      </button>
      <button type="button" onClick={() => logoutUser()} data-testid="do-logout">
        logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides initial state with no user', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(await screen.findByTestId('user-name')).toHaveTextContent('none');
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(screen.getByTestId('auth-state')).toHaveTextContent('false');
  });

  it('stores token on login', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      token: 'token-123',
      user: { id: 1, name: 'Neo', email: 'neo@test.com', is_admin: false },
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await user.click(screen.getByTestId('do-login'));

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBe('token-123');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Neo');
      expect(screen.getByTestId('auth-state')).toHaveTextContent('true');
    });
  });

  it('clears token on logout', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      token: 'token-abc',
      user: { id: 1, name: 'Neo', email: 'neo@test.com', is_admin: false },
    });
    logout.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await user.click(screen.getByTestId('do-login'));
    await waitFor(() => expect(localStorage.getItem('auth_token')).toBe('token-abc'));

    await user.click(screen.getByTestId('do-logout'));

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(screen.getByTestId('user-name')).toHaveTextContent('none');
      expect(screen.getByTestId('auth-state')).toHaveTextContent('false');
    });
  });

  it('provides user data from API login response', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      token: 'token-xyz',
      user: { id: 7, name: 'Morpheus', email: 'm@test.com', is_admin: true },
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await user.click(screen.getByTestId('do-login'));

    expect(await screen.findByText('Morpheus')).toBeInTheDocument();
    expect(localStorage.getItem('auth_user')).toContain('Morpheus');
  });
});
