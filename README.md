# Injecfn: Type-Safe Dependency Injection for TypeScript/JavaScript

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`Injecfn` is a lightweight, type-safe dependency injection helper library for
TypeScript and Deno projects. It provides a fluent and intuitive API to define
functions with explicit dependencies, offering robust type checking and flexible
default value management.

## Why Injecfn?

Dependency Injection is a powerful pattern for building modular and testable
applications. `Injecfn` aims to simplify this process in TypeScript/JavaScript
environments by:

- **Enhancing Type Safety**: Leverages TypeScript's type system to ensure that
  all required dependencies are correctly provided and typed.
- **Providing Flexibility**: Easily define required dependencies and optional
  default dependencies.
- **Offering a Clean API**: A minimalistic and fluent builder pattern makes
  defining injectables straightforward.
- **Simplifying Testing**: Makes it easy to mock dependencies in your tests.

## Features

- **Type-Safe Dependency Injection**: Catch dependency errors at compile time.
- **Fluent Builder API**: Chain methods to define your injecfn functions.
- **Required Dependencies**: Clearly define what a function needs to operate.
- **Default Dependencies**: Provide default values for dependencies, which can
  be overridden.
- **Dynamic Dependency Resolution**: Dependencies can be resolved by providing a
  function that receives the defaults.
- **Minimal Footprint**: A small, focused library with no external runtime
  dependencies.

## Installation

`Injecfn` is designed for Deno and TypeScript projects. You can import it
directly from its source URL (once published, e.g., on `deno.land/x`) or use it
as a local module.

For now, assuming it's a local module:

```typescript
import { injecfn } from "@nakanoaas/injecfn"; // Adjust path as necessary
```

## Basic Usage

### Defining a simple injecfn function

```typescript
import { injecfn } from "@nakanoaas/injecfn";

// Define a function that requires a 'factor' dependency
const multiplyByFactor = injecfn<{ factor: number }>()
  .fn(({ factor }, num: number) => {
    return factor * num;
  });

// Provide the dependency and get the final function
const multiplyByTwo = multiplyByFactor({ factor: 2 });
console.log(multiplyByTwo(5)); // Output: 10

const multiplyByFive = multiplyByFactor({ factor: 5 });
console.log(multiplyByFive(3)); // Output: 15
```

### Using Default Dependencies

`fnWithDefaults` allows you to specify default values for some or all
dependencies.

```typescript
import { injecfn } from "@nakanoaas/injecfn";

// Define a function that requires 'name' and has a default 'punctuation'
const createGreeting = injecfn<{ name: string }>()
  .fnWithDefaults(
    { punctuation: "!" }, // Default dependency
    ({ name, punctuation }, greetingWord: string) => {
      return `${greetingWord}, ${name}${punctuation}`;
    },
  );

// Use with only required dependencies (punctuation will be "!")
const greetAlice = createGreeting({ name: "Alice" });
console.log(greetAlice("Hello")); // Output: Hello, Alice!

// Override the default dependency
const greetBobWithQuestion = createGreeting({
  name: "Bob",
  punctuation: "?",
});
console.log(greetBobWithQuestion("Hi")); // Output: Hi, Bob?
```

### Dynamic Dependency Resolution with a Function

You can also provide a function to `constructTestFn` that receives the default
dependencies and returns the required ones. This is useful for deriving
dependencies based on defaults.

```typescript
import { injecfn } from "@nakanoaas/injecfn";

const constructMessage = injecfn<
  { messagePrefix: string; userCount: number }
>()
  .fnWithDefaults(
    { defaultSeparator: ": " }, // Default dependency
    ({ messagePrefix, userCount, defaultSeparator }, mainText: string) => {
      return `${messagePrefix}${defaultSeparator}${mainText} (Users: ${userCount})`;
    },
  );

// Dynamically set 'messagePrefix' and 'userCount' using defaults
const adminMessage = constructMessage((defaults) => ({
  messagePrefix: "Admin Log",
  userCount: 42,
  // defaultSeparator is available via 'defaults.defaultSeparator' if needed here
}));
console.log(adminMessage("System rebooting"));
// Output: Admin Log: System rebooting (Users: 42)

// Example from your initial query:
const constructTestFn = injecfn<{ req1: number; req2: string }>()
  .fnWithDefaults(
    { def1: "foo", def2: 1 },
    ({ req1, req2, def1, def2 }, arg1: number, arg2: string) => {
      return `${req1} ${req2} ${def1} ${def2} ${arg1} ${arg2}`;
    },
  );

const testFn1 = constructTestFn({ req1: 1, req2: "bar" });
console.log(testFn1(100, "hello")); // Output: 1 bar foo 1 100 hello

const testFn2 = constructTestFn((d) => ({
  req1: d.def1.length, // Derived from default 'def1'
  req2: "baz",
}));
console.log(testFn2(200, "world")); // Output: 3 baz foo 1 200 world
```

## API Reference

### `injecfn<Requires extends Record<string, unknown> | unknown>()`

Initiates the builder for an injecfn function.

- **`Requires`**: A generic type parameter defining the shape of the
  dependencies object required by the function. Defaults to `unknown` if no
  dependencies are needed.

Returns a `Builder` instance.

### `Builder<Requires>`

#### `fn<Args extends unknown[], Return>(factory: (deps: Requires, ...args: Args) => Return)`

Defines an injecfn function without default dependencies.

- **`Args`**: An array type for the arguments the final function will take.
- **`Return`**: The return type of the final function.
- **`factory`**: A function that takes the `deps` object (of type `Requires`)
  and any runtime `...args`, and returns a value of type `Return`.

Returns an `injecfn` function: `(deps: Requires) => (...args: Args) => Return`.

#### `fnWithDefaults<Defaults extends Record<string, unknown>, Args extends unknown[], Return>(defaults: Defaults, factory: (deps: Requires & Defaults, ...args: Args) => Return)`

Defines an injecfn function with default dependencies.

- **`Defaults`**: A type for the default dependencies object.
- **`Args`**: An array type for the arguments the final function will take.
- **`Return`**: The return type of the final function.
- **`defaults`**: An object containing the default dependency values.
- **`factory`**: A function that takes the merged `deps` object (of type
  `Requires & Defaults`) and any runtime `...args`, and returns a value of type
  `Return`.

Returns an `injecfnWithDefaults` function:
`(deps: (Requires & Partial<Defaults>) | ((defaults: Defaults) => Requires & Partial<Defaults>)) => (...args: Args) => Return`.

This means you can provide dependencies either as an object that merges
with/overrides defaults, or as a function that takes defaults and returns the
(partial) required dependencies.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull
request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` file for more information (you
would need to create this file).
