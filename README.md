# injecfn ⚡

**Effortless, Type-Safe Dependency Injection for Functions.**

[![JSR](https://jsr.io/badges/@nakanoaas/injecfn)](https://jsr.io/@nakanoaas/injecfn)
[![npm](https://badge.fury.io/js/@nakanoaas%2Finjecfn.svg)](https://badge.fury.io/js/@nakanoaas%2Finjecfn)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/nakanoaas/injecfn/blob/main/LICENSE)

---

## What is `injecfn`?

`injecfn` provides a clean, minimalistic way to apply the Dependency Injection
(DI) pattern to your TypeScript/JavaScript functions. Inspired by constructor
injection in object-oriented programming, it helps you write modular, testable,
and maintainable code by decoupling your function's logic from its concrete
dependencies.

**Instead of this...**

```typescript
// Hard-coded, coupled dependency
import { someApiClient } from "./api-client";

function fetchUser(id: string) {
  return someApiClient.get(`/users/${id}`);
}

// How do you test this without making a real API call?
```

**...you can write this:**

```typescript
// Dependency is declared and injected
import { injecfn } from "injecfn";

interface ApiClient {
  get(path: string): Promise<Response>;
}

const constructFetchUser = injecfn<{ apiClient: ApiClient }>().fn(
  ({ apiClient }, id: string) => {
    return apiClient.get(`/users/${id}`);
  },
);

// In your application code:
const fetchUser = constructFetchUser({ apiClient: realApiClient });

// In your test code:
const fetchUser_forTest = constructFetchUser({ apiClient: mockApiClient });
```

This simple shift makes your functions incredibly easy to test and reuse.

## Features

- ✅ **Type-Safe:** Fully typed to catch dependency errors at compile time.
- 🚀 **Minimalist API:** Just one core function to learn. Get started in
  minutes.
- 🧩 **Default Dependencies:** Easily provide default implementations for your
  dependencies.
- 📦 **Zero Dependencies:** A single, lightweight file. No baggage.
- 🌐 **Framework Agnostic:** Works anywhere—Node.js, Deno, browsers, etc.

## Installation

### Deno (via jsr)

```bash
deno add @nakanoaas/injecfn
```

### Node.js

Using npm:

```bash
npx jsr add @nakanoaas/injecfn
```

Using yarn:

```bash
yarn add @nakanoaas/injecfn
```

Using pnpm:

```bash
pnpm add @nakanoaas/injecfn
```

## Usage

Here's a step-by-step guide to using `injecfn`.

### 1. Define Your Dependencies

First, define the types for the services or values your function will depend on.
These can be interfaces, type aliases, or even simple functions.

```typescript
// A function-based dependency
type Greeter = (name: string) => string;

// An object-based dependency
interface Logger {
  log(message: string): void;
}
```

### 2. Create a Function "Constructor"

Next, use `injecfn` to create a "constructor" for your function. You declare the
required dependencies as a generic argument and can also provide default
implementations using `.fnWithDefaults()`.

```typescript
import { injecfn } from "injecfn";

// This function requires `greeter`, but `logger` is optional as it has a default.
const constructMyFunction = injecfn<{ greeter: Greeter }>().fnWithDefaults(
  // Default dependencies
  {
    logger: console as Logger, // `console` is used if no logger is provided
  },
  // The actual function logic, with dependencies destructured
  ({ greeter, logger }, name: string) => {
    const message = greeter(name);
    logger.log(message);
    return message;
  },
);
```

### 3. Inject Dependencies to Get Your Function

Now you can "construct" your function by providing the required dependencies.

```typescript
// Provide the required `greeter` dependency. `logger` will use the default.
const myFunc = constructMyFunction({
  greeter: (name) => `Hello, ${name}!`,
});

myFunc("World"); // Logs "Hello, World!" to the console
```

### 4. Override Defaults When Needed

You can easily override the default dependencies for specific use cases, like
testing.

```typescript
const myFuncForAlerts = constructMyFunction({
  greeter: (name) => `URGENT: ${name}`,
  logger: {
    log: (message) => alert(message), // Override the default `console.log`
  },
});

myFuncForAlerts("System Failure"); // Pops up an alert with "URGENT: System Failure"
```

## API Reference

### `injecfn<Requires>()`

The entry point for creating a function constructor.

- **`Requires`**: A generic type parameter for the required dependencies (e.g.,
  `{ service: MyService }`). If your function has no required dependencies, you
  can omit this.

### `.fn(implementation)`

Defines a function where all dependencies specified in `<Requires>` must be
provided.

- **`implementation`**: The function body: `(deps, ...args) => { ... }`.

### `.fnWithDefaults(defaults, implementation)`

Defines a function with both required and default dependencies.

- **`defaults`**: An object containing default implementations for some
  dependencies.
- **`implementation`**: The function body, which receives all merged
  dependencies.

### `Constructed<T>`

A utility type to extract the final, dependency-injected function type from a
constructor. Useful for type annotations.

```typescript
import { type Constructed } from "injecfn";

const constructMyFunc = injecfn<{ api: API }>().fn(...);

// MyFuncType is now fully typed as `(arg1: string) => number` (for example)
type MyFuncType = Constructed<typeof constructMyFunc>;

const myFunc: MyFuncType = constructMyFunc({ api: realApi });
```

## License

This project is licensed under the [MIT License](LICENSE).
