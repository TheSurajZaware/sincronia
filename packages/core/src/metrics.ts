type MetricRecord = {
  name: string;
  startedAt: number;
  endedAt?: number;
  success?: boolean;
};

export class MetricsCollector {
  private readonly records = new Map<string, MetricRecord>();

  start(name: string): void {
    this.records.set(name, { name, startedAt: Date.now() });
  }

  end(name: string, success: boolean): number | undefined {
    const rec = this.records.get(name);
    if (!rec) {
      return undefined;
    }
    rec.endedAt = Date.now();
    rec.success = success;
    return rec.endedAt - rec.startedAt;
  }

  snapshot(): Array<MetricRecord & { durationMs: number }> {
    return [...this.records.values()]
      .filter((r) => typeof r.endedAt === "number")
      .map((r) => ({
        ...r,
        durationMs: (r.endedAt as number) - r.startedAt,
      }));
  }
}
