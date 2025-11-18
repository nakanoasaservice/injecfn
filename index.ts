/**
 * @internal
 * A unique symbol used to identify a required dependency placeholder.
 */
export const requiredSymbol = Symbol("required");

/**
 * A placeholder function to mark a dependency as required.
 *
 * @template T - The type of the dependency that is required.
 * @returns A placeholder value that represents a required dependency.
 * @example
 * ```ts
 * const constructor = defineFn({
 *   // `db` is a required dependency of type `Database`.
 *   db: required<Database>(),
 *   // `logger` has a default value and is not strictly required.
 *   logger: console,
 * }, deps => { ... });
 * ```
 */
export function required<T>(): Required<T> {
  return requiredSymbol as Required<T>;
}

/**
 * A branded type representing a required dependency placeholder.
 * @template T - The type of the required dependency.
 * @internal
 */
type Required<T> = typeof requiredSymbol & {
  _type: T;
};

/**
 * A utility type that resolves the final dependency types,
 * replacing `Required<T>` placeholders with their actual type `T`.
 * @template T - The dependency definition object.
 * @internal
 */
type Dependencies<T extends Record<string, unknown>> = {
  readonly [K in keyof T]: T[K] extends Required<infer U> ? U : T[K];
};

/**
 * A utility type that extracts only the required dependencies from a definition.
 * It produces an object type where required dependencies are mandatory,
 * and dependencies with default values are optional (allowing overrides).
 * @template T - The dependency definition object.
 * @internal
 */
type Requirements<T extends Record<string, unknown>> =
  & {
    // Extracts keys for properties typed as `Required<T>` and makes them non-optional.
    [K in keyof T as T[K] extends Required<unknown> ? K : never]: T[K] extends
      Required<infer U> ? U : never;
  }
  & {
    // Extracts keys for properties that are not `Required<T>` and makes them optional.
    [K in keyof T as T[K] extends Required<unknown> ? never : K]?: T[K];
  };

/**
 * Represents the constructor function returned by `defineFn`.
 * It is a callable function that may or may not require an argument,
 * depending on whether there are required dependencies.
 *
 * @template T - The dependency definition object.
 * @template Fn - The type of the final constructed function.
 */
export interface FnConstructor<
  T extends Record<string, unknown>,
  Fn extends (...args: never[]) => unknown,
> {
  /**
   * Constructs the final function by providing dependencies.
   * @param requirements - An object containing the required dependencies and any optional overrides.
   *                       This argument is optional if no dependencies are marked as `required`.
   */
  (
    ...args: Extract<T[keyof T], Required<unknown>> extends never
      ? [requirements?: Requirements<T>]
      : [requirements: Requirements<T>]
  ): Fn;
}

/**
 * Defines a function with its dependencies.
 *
 * This function takes a dependency definition object and a function implementation.
 * It returns a "constructor" function. This constructor, when called, receives
 * the required dependencies and returns the final, dependency-injected function.
 *
 * @template T - The dependency definition object, which can include both default values and `required<T>()` placeholders.
 * @template Args - The arguments of the resulting function.
 * @template Return - The return type of the resulting function.
 * @param dependencies - An object defining the dependencies. Use a direct value for defaults, and `required<T>()` for mandatory dependencies.
 * @param f - The function implementation, which receives the resolved dependencies as its first argument.
 * @returns A constructor function to which you pass the required dependencies.
 */
export function defineFn<
  T extends Record<string, unknown>,
  Args extends unknown[],
  Return,
>(
  dependencies: T,
  f: (deps: Dependencies<T>, ...args: Args) => Return,
): FnConstructor<T, (...args: Args) => Return> {
  return ((requirements: Requirements<T>) => {
    // The `bind` method creates a new function that, when called, has its
    // `this` keyword set to the provided value, with a given sequence of arguments
    // preceding any provided when the new function is called.
    // We use `null` for `this` as it's not used, and we pre-fill the `deps` argument.
    return f.bind(
      null,
      { ...dependencies, ...requirements } as Dependencies<T>,
    );
  }) as (
    // The constructor's `requirements` argument is made optional if no dependencies are
    // marked as `required<T>()`. This provides a better developer experience.
    FnConstructor<T, (...args: Args) => Return>
  );
}

/**
 * A utility type to extract the final, constructed function type from a constructor.
 * @deprecated Use `ReturnType<typeof yourConstructorFn>` instead.
 *
 * @template ConstructorFn - The type of the function constructor returned by `defineFn`.
 * @example
 * ```ts
 * const constructMyFn = defineFn({ db: required<DB>() }, () => { ... });
 *
 * // Extracts the type of the function created after providing dependencies.
 * // type MyFn = () => void
 * type MyFn = ReturnType<typeof constructMyFn>;
 * ```
 */
export type Constructed<
  ConstructorFn extends (requirements: never) => (...args: never[]) => unknown,
> = ReturnType<ConstructorFn>;
