/**
 * Represents a function that constructs another function by injecting dependencies.
 * This is the return type of {@link FnConstructorBuilder.fn}.
 *
 * @template Requires - A record type of the dependencies that the function requires.
 * @template Fn - The type of the final constructed function.
 */
type FnConstructor<
  Requires extends Record<string, unknown> | unknown,
  Fn extends (...args: never[]) => unknown,
> = (deps: Requires) => Fn;

/**
 * Represents a function that constructs another function by injecting dependencies,
 * some of which have default values.
 * This is the return type of {@link FnConstructorBuilder.fnWithDefaults}.
 *
 * The `deps` parameter can be an object that satisfies the required dependencies and
 * optionally overrides the default ones, or it can be a function that receives the
 * defaults and returns the dependencies.
 *
 * @template Requires - A record type of the dependencies that the function requires.
 * @template Defaults - A record type of the dependencies that have default values.
 * @template Fn - The type of the final constructed function.
 */
type FnConstructorWithDefaults<
  Requires extends Record<string, unknown> | unknown,
  Defaults extends Record<string, unknown>,
  Fn extends (...args: never[]) => unknown,
> = (
  deps?:
    | (Requires & Partial<Defaults>)
    | ((defaults: Readonly<Defaults>) => Requires & Partial<Defaults>),
) => Fn;

/**
 * A builder interface for creating function constructors.
 * @template Requires - A record type of the dependencies that the function requires.
 */
interface FnConstructorBuilder<
  Requires extends Record<string, unknown> | unknown,
> {
  /**
   * Defines a function that depends on a set of required services.
   * All dependencies must be provided when constructing the function.
   *
   * @template Args - The arguments of the resulting function.
   * @template Return - The return type of the resulting function.
   * @param f - The function implementation. It receives the dependencies as its first argument.
   * @returns A {@link FnConstructor}.
   */
  fn<Args extends unknown[], Return>(
    f: (deps: Readonly<Requires>, ...args: Args) => Return,
  ): FnConstructor<Requires, (...args: Args) => Return>;

  /**
   * Defines a function that depends on a set of services, with default implementations.
   * This allows for optional overrides of default dependencies when constructing the function.
   *
   * @template Defaults - A record type of the default dependencies.
   * @template Args - The arguments of the resulting function.
   * @template Return - The return type of the resulting function.
   * @param defaults - An object containing the default dependencies.
   * @param f - The function implementation. It receives all dependencies (required and default) as its first argument.
   * @returns A {@link FnConstructorWithDefaults}.
   */
  fnWithDefaults<
    Defaults extends Record<string, unknown>,
    Args extends unknown[],
    Return,
  >(
    defaults: Defaults,
    f: (deps: Readonly<Requires & Defaults>, ...args: Args) => Return,
  ): FnConstructorWithDefaults<Requires, Defaults, (...args: Args) => Return>;
}

const builder: FnConstructorBuilder<unknown> = {
  fn: (f) => (deps) => f.bind(null, deps as Readonly<unknown>),
  fnWithDefaults: (defaults, f) => (deps) =>
    f.bind(null, {
      ...defaults,
      ...(typeof deps === "function" ? deps(defaults) : deps),
    }),
};

/**
 * Creates a builder for functions that require dependency injection.
 * This is a lightweight helper for providing dependency injection (DI) capabilities,
 * similar to constructor injection in classes, but for functions.
 *
 * It allows you to define a function that depends on a set of services or configurations,
 * and then create instances of that function with the dependencies supplied at runtime.
 *
 * @template Requires - A record type of the dependencies that the function requires.
 * @returns A {@link FnConstructorBuilder} to define the function.
 *
 * @example
 * ```ts
 * // 1. Define the dependencies your function will need.
 * type Greeter = (name: string) => string;
 *
 * interface Logger {
 *   log(message: string): void;
 * }
 *
 * // 2. Create a function constructor using `injecfn`.
 * const constructMyFunction = injecfn<{ greeter: Greeter }>().fnWithDefaults(
 *   // Default dependencies
 *   {
 *     logger: console as Logger,
 *   },
 *   // The actual function logic
 *   ({ greeter, logger }, name: string) => {
 *     const message = greeter(name);
 *     logger.log(message);
 *     return message;
 *   },
 * );
 *
 * // 3. "Instantiate" the function by providing the required dependencies.
 * const myFunc = constructMyFunction({
 *   greeter: (name) => `Hello, ${name}!`,
 *   // The `logger` dependency is optional here because it has a default value.
 * });
 *
 * // 4. Use the constructed function.
 * myFunc("World"); // Logs "Hello, World!" and returns it.
 *
 * // You can also override the default dependencies.
 * const myFuncWithCustomLogger = constructMyFunction({
 *   greeter: (name) => `Hi, ${name}!`,
 *   logger: {
 *     log: (message) => alert(message),
 *   },
 * });
 *
 * myFuncWithCustomLogger("User"); // Alerts "Hi, User!" and returns it.
 * ```
 */
export function injecfn<
  Requires extends Record<string, unknown> | unknown = unknown,
>(): FnConstructorBuilder<Requires> {
  return builder as FnConstructorBuilder<Requires>;
}

/**
 * A utility type to extract the final, constructed function type from a {@link FnConstructor}
 * or {@link FnConstructorWithDefaults}.
 *
 * @template ConstructorFn - The type of the function constructor.
 * @example
 * ```ts
 * const constructMy = injecfn<{ service: { do(): string } }>().fn(
 *   ({ service }) => service.do(),
 * );
 *
 * // Get the type of the function that will be created
 * type MyFunction = Constructed<typeof constructMy>;
 * // type MyFunction = () => string
 *
 * const myFunc: MyFunction = constructMy({ service: { do: () => "Done" } });
 * ```
 */
export type Constructed<
  ConstructorFn extends (deps: never) => (...args: never[]) => unknown,
> = ConstructorFn extends (deps: never) => infer Fn ? Fn : never;
