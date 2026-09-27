import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = jest.fn();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ centres: [], categories: [{ id: 'cardboard', name: 'Cardboard & paper' }], aiConfigured: false }) });
});

test('offers guided and manual booking paths', async () => {
  render(<App />);
  await screen.findByText('1');
  expect(screen.getByRole('heading', { name: /your next recycling visit/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /plan with the assistant/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /book manually/i }));
  expect(screen.getByRole('heading', { name: /book a recycling visit/i })).toBeInTheDocument();
});
