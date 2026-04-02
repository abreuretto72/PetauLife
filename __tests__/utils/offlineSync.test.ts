/**
 * Tests for lib/offlineSync — queue processor that runs mutations against the API.
 * All dependencies (offlineQueue, api, queryClient) are mocked so tests are pure
 * logic checks with no network or storage I/O.
 */

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockGetQueue = jest.fn();
const mockRemoveFromQueue = jest.fn();
const mockUpdateQueueItem = jest.fn();
const mockAddToFailedQueue = jest.fn();
const mockGetFailedQueue = jest.fn();
const mockClearFailedQueue = jest.fn();
const mockAddToQueue = jest.fn();

jest.mock('../../lib/offlineQueue', () => ({
  getQueue: (...args: unknown[]) => mockGetQueue(...args),
  removeFromQueue: (...args: unknown[]) => mockRemoveFromQueue(...args),
  updateQueueItem: (...args: unknown[]) => mockUpdateQueueItem(...args),
  addToFailedQueue: (...args: unknown[]) => mockAddToFailedQueue(...args),
  getFailedQueue: (...args: unknown[]) => mockGetFailedQueue(...args),
  clearFailedQueue: (...args: unknown[]) => mockClearFailedQueue(...args),
  addToQueue: (...args: unknown[]) => mockAddToQueue(...args),
}));

const mockCreatePet = jest.fn();
const mockUpdatePet = jest.fn();
const mockDeletePet = jest.fn();
const mockCreateDiaryEntry = jest.fn();
const mockUpdateDiaryEntry = jest.fn();
const mockDeleteDiaryEntry = jest.fn();
const mockCreateMoodLog = jest.fn();
const mockCreateVaccine = jest.fn();
const mockCreateExam = jest.fn();
const mockCreateMedication = jest.fn();
const mockCreateConsultation = jest.fn();
const mockCreateSurgery = jest.fn();
const mockCreateAllergy = jest.fn();

jest.mock('../../lib/api', () => ({
  createPet: (...args: unknown[]) => mockCreatePet(...args),
  updatePet: (...args: unknown[]) => mockUpdatePet(...args),
  deletePet: (...args: unknown[]) => mockDeletePet(...args),
  createDiaryEntry: (...args: unknown[]) => mockCreateDiaryEntry(...args),
  updateDiaryEntry: (...args: unknown[]) => mockUpdateDiaryEntry(...args),
  deleteDiaryEntry: (...args: unknown[]) => mockDeleteDiaryEntry(...args),
  createMoodLog: (...args: unknown[]) => mockCreateMoodLog(...args),
  createVaccine: (...args: unknown[]) => mockCreateVaccine(...args),
  createExam: (...args: unknown[]) => mockCreateExam(...args),
  createMedication: (...args: unknown[]) => mockCreateMedication(...args),
  createConsultation: (...args: unknown[]) => mockCreateConsultation(...args),
  createSurgery: (...args: unknown[]) => mockCreateSurgery(...args),
  createAllergy: (...args: unknown[]) => mockCreateAllergy(...args),
}));

const mockInvalidateQueries = jest.fn();
jest.mock('../../lib/queryClient', () => ({
  queryClient: { invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args) },
}));

import { processQueue, retryFailed } from '../../lib/offlineSync';
import type { QueuedMutation } from '../../lib/offlineQueue';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeMutation(overrides: Partial<QueuedMutation> = {}): QueuedMutation {
  return {
    id: 'mut-1',
    type: 'createPet',
    payload: { name: 'Rex' },
    createdAt: new Date().toISOString(),
    retries: 0,
    ...overrides,
  };
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // resetAllMocks clears both call history AND queued implementations (mockResolvedValueOnce etc.)
  jest.resetAllMocks();
  // Re-establish defaults for side-effect functions (they just need to resolve)
  mockRemoveFromQueue.mockResolvedValue(undefined);
  mockUpdateQueueItem.mockResolvedValue(undefined);
  mockAddToFailedQueue.mockResolvedValue(undefined);
  mockClearFailedQueue.mockResolvedValue(undefined);
  mockAddToQueue.mockResolvedValue(undefined);
  mockInvalidateQueries.mockResolvedValue(undefined);
});

// ── processQueue — empty ──────────────────────────────────────────────────────

describe('processQueue — empty queue', () => {
  it('returns zeros immediately without calling api', async () => {
    mockGetQueue.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const result = await processQueue();
    expect(result).toEqual({ synced: 0, failed: 0, remaining: 0, failedItems: [] });
    expect(mockCreatePet).not.toHaveBeenCalled();
  });
});

// ── processQueue — success ────────────────────────────────────────────────────

describe('processQueue — successful mutations', () => {
  it('syncs createPet and removes it from queue', async () => {
    const mutation = makeMutation({ type: 'createPet', payload: { name: 'Rex' } });
    mockGetQueue
      .mockResolvedValueOnce([mutation])  // initial queue
      .mockResolvedValueOnce([]);         // remaining after processing
    mockCreatePet.mockResolvedValue({ id: 'pet-1' });

    const result = await processQueue();

    expect(mockCreatePet).toHaveBeenCalledWith(mutation.payload);
    expect(mockRemoveFromQueue).toHaveBeenCalledWith(mutation.id);
    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.remaining).toBe(0);
  });

  it('syncs updatePet with extracted id and updates', async () => {
    const mutation = makeMutation({
      type: 'updatePet',
      payload: { id: 'pet-abc', updates: { name: 'Luna' } },
    });
    mockGetQueue.mockResolvedValueOnce([mutation]).mockResolvedValueOnce([]);
    mockUpdatePet.mockResolvedValue({});

    await processQueue();

    expect(mockUpdatePet).toHaveBeenCalledWith('pet-abc', { name: 'Luna' });
  });

  it('syncs deletePet with id from payload', async () => {
    const mutation = makeMutation({ type: 'deletePet', payload: { id: 'pet-xyz' } });
    mockGetQueue.mockResolvedValueOnce([mutation]).mockResolvedValueOnce([]);
    mockDeletePet.mockResolvedValue({});

    await processQueue();

    expect(mockDeletePet).toHaveBeenCalledWith('pet-xyz');
  });

  it('syncs createDiaryEntry', async () => {
    const mutation = makeMutation({ type: 'createDiaryEntry', payload: { pet_id: 'p1', text: 'hello' } });
    mockGetQueue.mockResolvedValueOnce([mutation]).mockResolvedValueOnce([]);
    mockCreateDiaryEntry.mockResolvedValue({});

    await processQueue();

    expect(mockCreateDiaryEntry).toHaveBeenCalled();
  });

  it('invalidates pets cache when synced > 0', async () => {
    const mutation = makeMutation({ type: 'createPet', payload: { name: 'Rex' } });
    mockGetQueue.mockResolvedValueOnce([mutation]).mockResolvedValueOnce([]);
    mockCreatePet.mockResolvedValue({});

    await processQueue();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['pets'] });
  });

  it('invalidates per-pet caches when pet_id is in payload', async () => {
    const mutation = makeMutation({
      type: 'createDiaryEntry',
      payload: { pet_id: 'pet-42', text: 'walk' },
    });
    mockGetQueue.mockResolvedValueOnce([mutation]).mockResolvedValueOnce([]);
    mockCreateDiaryEntry.mockResolvedValue({});

    await processQueue();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['pet', 'pet-42'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['pets', 'pet-42', 'diary'] });
  });

  it('processes multiple mutations in FIFO order', async () => {
    const order: string[] = [];
    mockCreatePet.mockImplementation(() => { order.push('createPet'); return Promise.resolve({}); });
    mockCreateDiaryEntry.mockImplementation(() => { order.push('createDiaryEntry'); return Promise.resolve({}); });

    const queue = [
      makeMutation({ id: 'a', type: 'createPet' }),
      makeMutation({ id: 'b', type: 'createDiaryEntry', payload: { pet_id: 'p', text: 'x' } }),
    ];
    mockGetQueue.mockResolvedValueOnce(queue).mockResolvedValueOnce([]);

    const result = await processQueue();

    expect(order).toEqual(['createPet', 'createDiaryEntry']);
    expect(result.synced).toBe(2);
  });
});

// ── processQueue — failures ───────────────────────────────────────────────────

describe('processQueue — failed mutations', () => {
  it('increments retries (stays in queue) when retries < MAX_RETRIES', async () => {
    const mutation = makeMutation({ retries: 1 }); // MAX_RETRIES is 3
    mockGetQueue.mockResolvedValueOnce([mutation]).mockResolvedValueOnce([mutation]);
    mockCreatePet.mockRejectedValue(new Error('timeout'));

    const result = await processQueue();

    expect(mockUpdateQueueItem).toHaveBeenCalledWith(mutation.id, { retries: 2 });
    expect(mockRemoveFromQueue).not.toHaveBeenCalled();
    expect(result.failed).toBe(0);
    expect(result.synced).toBe(0);
  });

  it('moves to failed queue and removes from main queue when retries === MAX_RETRIES (3)', async () => {
    const mutation = makeMutation({ retries: 3 });
    mockGetQueue.mockResolvedValueOnce([mutation]).mockResolvedValueOnce([]);
    mockCreatePet.mockRejectedValue(new Error('server error'));

    const result = await processQueue();

    expect(mockAddToFailedQueue).toHaveBeenCalledWith(mutation, 'server error');
    expect(mockRemoveFromQueue).toHaveBeenCalledWith(mutation.id);
    expect(result.failed).toBe(1);
    expect(result.failedItems).toEqual([{ type: 'createPet', error: 'server error' }]);
  });

  it('handles non-Error thrown values gracefully', async () => {
    const mutation = makeMutation({ retries: 3 });
    mockGetQueue.mockResolvedValueOnce([mutation]).mockResolvedValueOnce([]);
    mockCreatePet.mockRejectedValue('string error');

    const result = await processQueue();

    expect(result.failedItems[0].error).toBe('string error');
  });

  it('continues processing remaining mutations after one fails', async () => {
    const failing = makeMutation({ id: 'fail', retries: 3 });
    const passing = makeMutation({ id: 'pass', type: 'deletePet', payload: { id: 'p' } });

    mockGetQueue.mockResolvedValueOnce([failing, passing]).mockResolvedValueOnce([]);
    mockCreatePet.mockRejectedValue(new Error('err'));
    mockDeletePet.mockResolvedValue({});

    const result = await processQueue();

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(1);
  });

  it('does not invalidate cache when nothing was synced', async () => {
    const mutation = makeMutation({ retries: 1 });
    mockGetQueue.mockResolvedValueOnce([mutation]).mockResolvedValueOnce([mutation]);
    mockCreatePet.mockRejectedValue(new Error('err'));

    await processQueue();

    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });
});

// ── retryFailed ───────────────────────────────────────────────────────────────

describe('retryFailed', () => {
  it('returns 0 immediately when failed queue is empty', async () => {
    mockGetFailedQueue.mockResolvedValue([]);

    const count = await retryFailed();

    expect(count).toBe(0);
    expect(mockAddToQueue).not.toHaveBeenCalled();
  });

  it('re-enqueues failed items with retries reset and clears failed queue', async () => {
    const failedItem = { ...makeMutation({ retries: 3 }), error: 'timeout', failedAt: new Date().toISOString() };
    mockGetFailedQueue.mockResolvedValue([failedItem]);
    // processQueue will call getQueue — return the re-enqueued item then empty
    const requeued = makeMutation({ retries: 0 });
    mockAddToQueue.mockResolvedValue(requeued);
    mockGetQueue.mockResolvedValueOnce([requeued]).mockResolvedValueOnce([]);
    mockCreatePet.mockResolvedValue({});

    const count = await retryFailed();

    expect(mockAddToQueue).toHaveBeenCalledWith({
      type: failedItem.type,
      payload: failedItem.payload,
    });
    expect(mockClearFailedQueue).toHaveBeenCalled();
    expect(count).toBe(1);
  });
});
