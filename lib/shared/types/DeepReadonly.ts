export type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined;

// DeepReadonly: compile-time only, recursively readonly for objects/arrays/maps/sets.
export type DeepReadonly<T> =
  // Primitives, functions, and Date are left as-is
  T extends Primitive | ((...args: unknown[]) => unknown) | Date
    ? T
    : // Containers
      T extends Map<infer K, infer V>
      ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
      : T extends Set<infer U>
        ? ReadonlySet<DeepReadonly<U>>
        : T extends Array<infer U>
          ? ReadonlyArray<DeepReadonly<U>>
          : // Objects
            T extends object
            ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
            : T;
