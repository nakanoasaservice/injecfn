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
    | ((defaults: Defaults) => Requires & Partial<Defaults>),
) => (...args: Args) => Return;

export type Constructed<
  ConstructorFn extends (deps: never) => (...args: never[]) => unknown,
> = ConstructorFn extends (deps: never) => infer Fn ? Fn : never;

class FnConstructorBuilder<Requires extends Record<string, unknown> | unknown> {
  fn<Args extends unknown[], Return>(
    f: (deps: Requires, ...args: Args) => Return,
  ): FnConstructor<Requires, Args, Return> {
    return (deps: Requires) => f.bind(null, deps);
  }

  fnWithDefaults<
    Defaults extends Record<string, unknown>,
    Args extends unknown[],
    Return,
  >(
    defaults: Defaults,
    f: (deps: Requires & Defaults, ...args: Args) => Return,
  ): FnConstructorWithDefaults<Requires, Defaults, Args, Return> {
    return (deps) => {
      const allDeps = {
        ...defaults,
        ...(typeof deps === "function" ? deps(defaults) : deps),
      };

      return f.bind(null, allDeps);
    };
  }
}

const builder = new FnConstructorBuilder<unknown>();

export function injecfn<
  Requires extends Record<string, unknown> | unknown = unknown,
>(): FnConstructorBuilder<Requires> {
  return builder as FnConstructorBuilder<Requires>;
}
