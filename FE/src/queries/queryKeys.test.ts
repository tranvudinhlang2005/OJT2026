import { describe, it, expect } from 'vitest';
import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
  it('shares domain root prefixes for invalidation', () => {
    expect(queryKeys.classes.list({ status: 'OPEN' }, { page: 0, size: 20 })[0]).toBe(
      queryKeys.classes.all[0]
    );
    expect(queryKeys.users.list({ role: 'STUDENT' })[0]).toBe(queryKeys.users.all[0]);
    expect(queryKeys.dashboard.summary({})[0]).toBe(queryKeys.dashboard.all[0]);
    expect(queryKeys.teacher.schedule('2026-11-23', '2026-11-29')[0]).toBe(
      queryKeys.teacher.all[0]
    );
    expect(queryKeys.student.results({ page: 0, size: 20 })[0]).toBe(queryKeys.student.all[0]);
  });

  it('produces distinct keys for different pagination pages and filters', () => {
    const page0 = queryKeys.classes.list({ status: 'OPEN' }, { page: 0, size: 20 });
    const page1 = queryKeys.classes.list({ status: 'OPEN' }, { page: 1, size: 20 });
    const closed = queryKeys.classes.list({ status: 'CLOSED' }, { page: 0, size: 20 });

    expect(page0).not.toEqual(page1);
    expect(page0).not.toEqual(closed);
  });
});
