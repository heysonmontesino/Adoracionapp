export const db = {}
export const Timestamp = { now: jest.fn(), fromDate: jest.fn() }
export const getDocument = jest.fn()
export const addDocument = jest.fn()
export const setDocument = jest.fn()
export const updateDocument = jest.fn()
export const queryDocuments = jest.fn()
export const generateDocId = jest.fn(() => 'mock-xp-event-id')
// executeTransaction executes the callback synchronously with a mock tx context.
// Tests override tx.get per-case to simulate existing / missing docs.
export const executeTransaction = jest.fn(
  async (callback: (tx: { get: jest.Mock; set: jest.Mock; update: jest.Mock }) => Promise<unknown>) => {
    const tx = { get: jest.fn().mockResolvedValue(null), set: jest.fn(), update: jest.fn() }
    return callback(tx)
  },
)
