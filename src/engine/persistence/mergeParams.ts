type Plain = Record<string, unknown>;

const isPlain = (v: unknown): v is Plain =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function mergeInto(target: Plain, source: unknown): void {
  if (!isPlain(source)) return;

  for (const key of Object.keys(target)) {
    const current = target[key];
    const incoming = source[key];
    if (isPlain(current)) {
      mergeInto(current, incoming);
    } else if (typeof incoming === typeof current) {
      target[key] = incoming;
    }
  }
}
