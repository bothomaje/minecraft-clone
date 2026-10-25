export type StateSchema = Readonly<Record<string, readonly string[]>>;
export type StateValues = Readonly<Record<string, string>>;

export const MAX_STATES = 256;

export function stateCount(schema: StateSchema): number {
  return Object.values(schema).reduce((n, values) => n * values.length, 1);
}

export function assertValidSchema(name: string, schema: StateSchema): void {
  if (stateCount(schema) > MAX_STATES) {
    throw new Error(
      `Block ${name} has more than ${MAX_STATES} state combinations`,
    );
  }
}

export function packState(
  schema: StateSchema | undefined,
  values?: StateValues,
): number {
  if (!schema) return 0;

  let packed = 0;
  let stride = 1;
  for (const [key, allowed] of Object.entries(schema)) {
    const index = Math.max(0, allowed.indexOf(values?.[key] ?? allowed[0]));
    packed += index * stride;
    stride *= allowed.length;
  }
  return packed;
}

export function unpackState(
  schema: StateSchema | undefined,
  packed: number,
): StateValues {
  if (!schema) return {};

  const values: Record<string, string> = {};
  let rest = packed;
  for (const [key, allowed] of Object.entries(schema)) {
    values[key] = allowed[rest % allowed.length];
    rest = Math.floor(rest / allowed.length);
  }
  return values;
}
