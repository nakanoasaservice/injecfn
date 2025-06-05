type Constructor<
  Requires extends Record<string, unknown> | unknown,
  Args extends unknown[],
  Return,
> = (deps: Requires) => (...args: Args) => Return;

type ConstructorWithDefaults<
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

class ConstructorBuilder<Requires extends Record<string, unknown> | unknown> {
  fn<Args extends unknown[], Return>(
    f: (deps: Requires, ...args: Args) => Return,
  ): Constructor<Requires, Args, Return> {
    return (deps: Requires) => (...args: Args) => f(deps, ...args);
  }

  fnWithDefaults<
    Defaults extends Record<string, unknown>,
    Args extends unknown[],
    Return,
  >(
    defaults: Defaults,
    f: (deps: Requires & Defaults, ...args: Args) => Return,
  ): ConstructorWithDefaults<Requires, Defaults, Args, Return> {
    return (deps) => {
      const allDeps = {
        ...defaults,
        ...(typeof deps === "function" ? deps(defaults) : deps),
      };

      return (...args: Args) => f(allDeps, ...args);
    };
  }
}

const builder = new ConstructorBuilder<unknown>();

export function injecfn<
  Requires extends Record<string, unknown> | unknown = unknown,
>(): ConstructorBuilder<Requires> {
  return builder as ConstructorBuilder<Requires>;
}
