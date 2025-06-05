type Injectable<
  Requires extends Record<string, unknown> | unknown,
  Args extends unknown[],
  Return,
> = (deps: Requires) => (...args: Args) => Return;

type InjectableWithDefaults<
  Requires extends Record<string, unknown> | unknown,
  Defaults extends Record<string, unknown>,
  Args extends unknown[],
  Return,
> = (
  deps:
    | (Requires & Partial<Defaults>)
    | ((defaults: Defaults) => Requires & Partial<Defaults>),
) => (...args: Args) => Return;

class Builder<Requires extends Record<string, unknown> | unknown> {
  fn<Args extends unknown[], Return>(
    f: (deps: Requires, ...args: Args) => Return,
  ): Injectable<Requires, Args, Return> {
    return (deps: Requires) => (...args: Args) => f(deps, ...args);
  }

  fnWithDefaults<
    Defaults extends Record<string, unknown>,
    Args extends unknown[],
    Return,
  >(
    defaults: Defaults,
    f: (deps: Requires & Defaults, ...args: Args) => Return,
  ): InjectableWithDefaults<Requires, Defaults, Args, Return> {
    return (deps) => {
      const allDeps = {
        ...defaults,
        ...(typeof deps === "function" ? deps(defaults) : deps),
      };

      return (...args: Args) => f(allDeps, ...args);
    };
  }
}

const builder = new Builder<unknown>();

export function injectable<
  Requires extends Record<string, unknown> | unknown = unknown,
>(): Builder<Requires> {
  return builder as Builder<Requires>;
}
