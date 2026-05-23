import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const GoodChild = () => <div>All good</div>;

const BadChild = () => {
  throw new Error('Test error');
};

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

it('renders children when no error', () => {
  render(
    <ErrorBoundary>
      <GoodChild />
    </ErrorBoundary>,
  );

  expect(screen.getByText('All good')).toBeInTheDocument();
});

it('shows fallback when child throws', () => {
  render(
    <ErrorBoundary>
      <BadChild />
    </ErrorBoundary>,
  );

  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  expect(screen.getByText('Try again')).toBeInTheDocument();
});

it('renders custom fallback prop', () => {
  render(
    <ErrorBoundary fallback={<div>Custom error UI</div>}>
      <BadChild />
    </ErrorBoundary>,
  );

  expect(screen.getByText('Custom error UI')).toBeInTheDocument();
});

it('resets error state when Try again is clicked', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

  const { rerender } = render(
    <ErrorBoundary>
      <BadChild />
    </ErrorBoundary>,
  );

  expect(screen.getByText('Something went wrong')).toBeInTheDocument();

  rerender(
    <ErrorBoundary>
      <GoodChild />
    </ErrorBoundary>,
  );

  fireEvent.click(screen.getByText('Try again'));

  expect(screen.getByText('All good')).toBeInTheDocument();

  spy.mockRestore();
});
