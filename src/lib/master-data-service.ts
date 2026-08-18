/**
 * In-memory stand-in for a REST/FastAPI master-data endpoint.
 * Every call is async and returns fresh copies, so call sites don't change
 * shape when this is later swapped for real `fetch` calls.
 */
function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface MasterDataService<T extends { id: string; status: string }> {
  list: () => Promise<T[]>;
  getById: (id: string) => Promise<T | undefined>;
  create: (input: Omit<T, "id">) => Promise<T>;
  update: (id: string, patch: Partial<Omit<T, "id">>) => Promise<T>;
  setStatus: (id: string, status: T["status"]) => Promise<T>;
}

export function createMasterDataService<T extends { id: string; status: string }>(
  seed: T[],
  idPrefix: string,
): MasterDataService<T> {
  let records = [...seed];
  let counter = seed.length;

  function update(id: string, patch: Partial<Omit<T, "id">>): Promise<T> {
    let updated: T | undefined;
    records = records.map((record) => {
      if (record.id !== id) return record;
      updated = { ...record, ...patch };
      return updated;
    });
    if (!updated) {
      throw new Error(`Record "${id}" not found`);
    }
    return delay(updated);
  }

  return {
    list: () => delay([...records]),
    getById: (id) => delay(records.find((record) => record.id === id)),
    create: (input) => {
      counter += 1;
      const record = { ...input, id: `${idPrefix}-${String(counter).padStart(3, "0")}` } as T;
      records = [record, ...records];
      return delay(record);
    },
    update,
    setStatus: (id, status) => update(id, { status } as Partial<Omit<T, "id">>),
  };
}
