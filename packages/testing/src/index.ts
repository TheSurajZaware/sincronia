export type GlideRecordMockRow = Record<string, unknown>;

export class GlideRecordMock {
  constructor(private readonly rows: GlideRecordMockRow[]) {}

  query(): void {
    // no-op in tests
  }

  next(): GlideRecordMockRow | undefined {
    return this.rows.shift();
  }
}

export const createServiceNowTestContext = () => ({
  gs: {
    info: (...args: unknown[]) => {
      process.stdout.write(`[gs.info] ${args.join(" ")}\n`);
    },
    error: (...args: unknown[]) => {
      process.stderr.write(`[gs.error] ${args.join(" ")}\n`);
    },
  },
  GlideRecord: GlideRecordMock,
});
