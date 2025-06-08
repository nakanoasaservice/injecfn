type FnConstructor<
  Requires extends Record<string, unknown> | unknown,
  Args extends unknown[],
  Return,
> = (deps: Requires) => (...args: Args) => Return;

type FnConstructorWithDefaults<
  Requires extends Record<string, unknown> | unknown,
  Defaults extends Record<string, unknown>,
  Args extends unknown[],
  Return,
> = (
  deps:
    | (Requires & Partial<Defaults>)
    | ((defaults: Readonly<Defaults>) => Requires & Partial<Defaults>),
) => (...args: Args) => Return;

interface FnConstructorBuilder<
  Requires extends Record<string, unknown> | unknown,
> {
  fn<Args extends unknown[], Return>(
    f: (deps: Readonly<Requires>, ...args: Args) => Return,
  ): FnConstructor<Requires, Args, Return>;

  fnWithDefaults<
    Defaults extends Record<string, unknown>,
    Args extends unknown[],
    Return,
  >(
    defaults: Defaults,
    f: (deps: Readonly<Requires & Defaults>, ...args: Args) => Return,
  ): FnConstructorWithDefaults<Requires, Defaults, Args, Return>;
}

const builder: FnConstructorBuilder<unknown> = {
  fn: (f) => (deps) => f.bind(null, deps as Readonly<unknown>),
  fnWithDefaults: (defaults, f) => (deps) =>
    f.bind(null, {
      ...defaults,
      ...(typeof deps === "function" ? deps(defaults) : deps),
    }),
};

export function injecfn<
  Requires extends Record<string, unknown> | unknown = unknown,
>(): FnConstructorBuilder<Requires> {
  return builder as FnConstructorBuilder<Requires>;
}

export type Constructed<
  ConstructorFn extends (deps: never) => (...args: never[]) => unknown,
> = ConstructorFn extends (deps: never) => infer Fn ? Fn : never;
