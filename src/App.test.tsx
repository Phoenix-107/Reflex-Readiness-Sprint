import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';

describe('App component', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }) as any;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    global.fetch = originalFetch;
  });

  it('renders without throwing (smoke test)', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('renders header without "Reseed Demo" or reset button', () => {
    render(<App />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    expect(header.textContent).not.toMatch(/reseed demo/i);
    expect(screen.queryByText(/reseed demo/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/reset demo/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reseed demo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
  });

  it('logs no console errors referencing resetDemo or handleResetDemoData', () => {
    render(<App />);

    const errorCalls = consoleErrorSpy.mock.calls.flat().join(' ');
    expect(errorCalls).not.toContain('resetDemo');
    expect(errorCalls).not.toContain('handleResetDemoData');
  });
});
