import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RunConfigForm from '@/src/components/RunConfigForm';
import { ToastProvider } from '@/src/components/ToastProvider';
import * as api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  fetchTasks: vi.fn(),
  listDatasets: vi.fn(),
  getModels: vi.fn(),
  createRun: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockModels = [
  { id: 'gemini-pro', name: 'Gemini Pro', available: true, provider: 'gemini' },
  { id: 'ollama-llama3', name: 'Llama 3 (Ollama)', available: false, provider: 'ollama' },
];

const mockDatasets = [{ dataset_id: 'ds1', name: 'Dataset 1' }];

describe('RunConfigForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getModels as ReturnType<typeof vi.fn>).mockResolvedValue(mockModels);
    (api.listDatasets as ReturnType<typeof vi.fn>).mockResolvedValue(mockDatasets);
  });

  it('renders loading state initially', () => {
    (api.fetchTasks as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    render(<ToastProvider><RunConfigForm /></ToastProvider>);
    expect(screen.getByRole('button', { name: /Start Run/i })).toBeDisabled();
    expect(screen.getByText('Loading tasks…')).toBeInTheDocument();
  });

  it('populates with tasks and selects initialTaskId', async () => {
    (api.fetchTasks as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { task_id: 'task1', description: 'desc1' },
      { task_id: 'task2', description: 'desc2' },
    ]);
    render(<ToastProvider><RunConfigForm initialTaskId="task2" /></ToastProvider>);

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks…')).toBeNull();
    });

    const taskSelect = screen.getByRole('combobox', { name: /task/i }) as HTMLSelectElement;
    expect(taskSelect.value).toBe('task2');
  });

  it('shows error toast on tasks API failure', async () => {
    (api.fetchTasks as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Fetch failed'));

    render(<ToastProvider><RunConfigForm /></ToastProvider>);

    await waitFor(() => {
      expect(screen.getByText('Fetch failed')).toBeInTheDocument();
    });
  });

  it('fetches datasets when task changes', async () => {
    (api.fetchTasks as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { task_id: 'task1', description: 'desc1' },
    ]);

    render(<ToastProvider><RunConfigForm initialTaskId="task1" /></ToastProvider>);

    await waitFor(() => {
      expect(api.listDatasets).toHaveBeenCalledWith('task1');
    });

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /dataset/i })).toBeInTheDocument();
    });
  });

  it('dataset dropdown is disabled until task is selected', async () => {
    (api.fetchTasks as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    render(<ToastProvider><RunConfigForm /></ToastProvider>);

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks…')).toBeNull();
    });

    const datasetSelect = screen.getByRole('combobox', { name: /dataset/i });
    expect(datasetSelect).toBeDisabled();
  });

  it('renders model radio list with availability', async () => {
    (api.fetchTasks as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { task_id: 'task1', description: 'desc1' },
    ]);

    render(<ToastProvider><RunConfigForm initialTaskId="task1" /></ToastProvider>);

    await waitFor(() => {
      expect(screen.getByLabelText(/Gemini Pro/i)).toBeInTheDocument();
    });

    const geminiRadio = screen.getByLabelText(/Gemini Pro/i) as HTMLInputElement;
    expect(geminiRadio.disabled).toBe(false);

    const llamaRadio = screen.getByLabelText(/Llama 3/i) as HTMLInputElement;
    expect(llamaRadio.disabled).toBe(true);
  });

  it('renders JSON preview block', async () => {
    (api.fetchTasks as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { task_id: 'task1', description: 'desc1' },
    ]);

    render(<ToastProvider><RunConfigForm initialTaskId="task1" /></ToastProvider>);

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks…')).toBeNull();
    });

    const pre = document.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toContain('task_id');
  });

  it('disables submit while loading', async () => {
    (api.fetchTasks as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { task_id: 'task1', description: 'desc1' },
    ]);
    let resolveCreate: (v: { run_id: string; message: string }) => void;
    const pendingPromise = new Promise<{ run_id: string; message: string }>((resolve) => {
      resolveCreate = resolve;
    });
    (api.createRun as ReturnType<typeof vi.fn>).mockReturnValueOnce(pendingPromise);

    render(<ToastProvider><RunConfigForm initialTaskId="task1" /></ToastProvider>);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Run/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Start Run/i }));

    await waitFor(() => {
      const submitBtn = screen.getByRole('button', { name: /Starting…/i });
      expect(submitBtn).toBeDisabled();
    });

    resolveCreate!({ run_id: '123', message: 'ok' });
  });

  it('shows error toast on createRun failure', async () => {
    (api.fetchTasks as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { task_id: 'task1', description: 'desc1' },
    ]);
    (api.createRun as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Run failed'));

    render(<ToastProvider><RunConfigForm initialTaskId="task1" /></ToastProvider>);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Run/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Start Run/i }));

    await waitFor(() => {
      expect(screen.getByText('Run failed')).toBeInTheDocument();
    });
  });
});
