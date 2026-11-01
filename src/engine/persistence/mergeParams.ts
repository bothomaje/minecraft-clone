type Plain = Record<string, unknown>;

const isPlain = (v: unknown): v is Plain =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function mergeInto<T extends object>(target: T, source: unknown): void {
  if (!isPlain(source)) return;

  const targetRecord = target as Record<string, unknown>;

  for (const key of Object.keys(targetRecord)) {
    const current = targetRecord[key];
    const incoming = source[key];
    if (isPlain(current)) {
      mergeInto(current, incoming);
    } else if (typeof incoming === typeof current) {
      targetRecord[key] = incoming;
    }
  }
}
