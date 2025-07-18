# injecfn ⚡

**Effortless, Type-Safe Dependency Injection for Functions.**

[![JSR](https://jsr.io/badges/@nakanoaas/injecfn)](https://jsr.io/@nakanoaas/injecfn)
[![npm](https://badge.fury.io/js/@nakanoaas%2Finjecfn.svg)](https://badge.fury.io/js/@nakanoaas%2Finjecfn)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/nakanoaas/injecfn/blob/main/LICENSE)

---

## What is `injecfn`?

`injecfn` offers a clean, declarative, and type-safe way to manage dependencies
for your functions. It helps you separate what a function **requires** from what
it **can** use with sensible defaults, making your code more modular, testable,
and easier to reason about.

**The Problem:** Functions often need a mix of dependencies. Some are essential
(`paymentProcessor`), while others are good to have but can be defaulted
(`logger`). This can lead to complex function signatures, messy call sites, and
a tight coupling between a function's logic and its environment.

**The `injecfn` Solution:** Decouple dependency resolution from your function's
core logic using a single, powerful function: `defineFn`.

```typescript
import { defineFn, required } from "@nakanoaas/injecfn";

// 1. Define your dependency types
interface PaymentProcessor {
  charge(amount: number): void;
}
interface Logger {
  log(message: string): void;
}

// 2. Create a "constructor" by defining all dependencies in one place.
const constructProcessOrder = defineFn(
  // 3. Mark required dependencies with `required()`. Provide values for defaults.
  {
    paymentProcessor: required<PaymentProcessor>(),
    logger: console as Logger,
  },
  // 4. Write your core logic. The types are inferred automatically!
  ({ paymentProcessor, logger }, order: Order) => {
    logger.log(`Processing order ${order.id}`);
    paymentProcessor.charge(order.amount);
  },
);

// --- At instantiation time, things are much cleaner ---

// You ONLY need to provide the required `paymentProcessor`.
const processOrder = constructProcessOrder({
  paymentProcessor: stripeProcessor,
});

// ...but you can still override the default when needed, e.g., for tests.
const processOrderWithCustomLogging = constructProcessOrder({
  paymentProcessor: stripeProcessor,
  logger: customAnalyticsLogger,
});

processOrder(myOrder);
```

Notice the clarity: Required and default dependencies are declared in a single
configuration object. The type system enforces that all required dependencies
are provided, while intelligently inferring the types of defaults.

## Features

- ✅ **Type-Safe & Declarative:** Define all dependencies in a single object.
  Required dependencies are enforced by the TypeScript compiler.
- 🚀 **Minimalist API:** One core function, `defineFn`, is all you need to
  learn.
- 🧩 **Smart Defaults:** Provide default implementations for any dependency
  right where you define it.
- 📦 **Zero Dependencies:** A single, lightweight file. No baggage.
- 🌐 **Framework Agnostic:** Works anywhere—Node.js, Deno, browsers, etc.

## Installation

### Deno (via JSR)

```bash
deno add @nakanoaas/injecfn
```

### Node.js / Bun

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

```typescript
// A function-based dependency
type Greeter = (name: string) => string;

// An object-based dependency
interface Logger {
  log(message: string): void;
}
```

### 2. Create a Function "Constructor"

Next, use `defineFn` to create a "constructor" for your function. You define all
dependencies in a single object.

- For dependencies that **must be provided** at construction time, use the
  `required<T>()` placeholder.
- For dependencies that should have a **default value**, provide the
  implementation directly.

```typescript
import { defineFn, required } from "@nakanoaas/injecfn";

const constructMyFunction = defineFn(
  {
    // This dependency is required and must be of type `Greeter`.
    greeter: required<Greeter>(),
    // This dependency is optional and defaults to `console`.
    logger: console as Logger,
  },
  // The actual function logic, with dependencies destructured.
  // Their types are fully inferred.
  ({ greeter, logger }, name: string) => {
    const message = greeter(name);
    logger.log(message);
    return message;
  },
);
```

### 3. Inject Dependencies to Get Your Function

Now you can "construct" your function by calling the constructor. The type
system will ensure you provide all the `required` dependencies.

```typescript
// Provide the required `greeter` dependency. `logger` will use the default.
const myFunc = constructMyFunction({
  greeter: (name) => `Hello, ${name}!`,
});

myFunc("World"); // Logs "Hello, World!" to the console
```

If you forget a required dependency, you'll get a compile-time error.

```typescript
// @ts-expect-error: Property 'greeter' is missing.
const myFunc = constructMyFunction({});
```

### 4. Override Defaults When Needed

You can easily override the default dependencies for specific use cases, like
testing or alternate configurations.

```typescript
const myFuncForAlerts = constructMyFunction({
  greeter: (name) => `URGENT: ${name}`,
  logger: {
    log: (message) => alert(message), // Override the default `console.log`
  },
});

myFuncForAlerts("System Failure"); // Pops up an alert
```

## API Reference

### `defineFn(dependencies, implementation)`

The core function of `injecfn`. It creates a "constructor" for your
dependency-injected function.

- **`dependencies`**: An object that defines all dependencies for your function.
  - Use `required<MyType>()` to mark a dependency as mandatory.
  - Provide a direct value (e.g., `console`, a mock object, a default function)
    to set a default implementation.
- **`implementation`**: The function body: `(deps, ...args) => { ... }`. The
  `deps` argument will be a fully-typed object with all dependencies resolved.

### `required<T>()`

A placeholder function used inside the `dependencies` object of `defineFn` to
mark a dependency as required.

- **`T`**: The type of the dependency that must be provided.

### `Constructed<T>` (Deprecated)

> [!WARNING]
> This type is deprecated and will be removed in a future version. Please use
> `ReturnType<typeof yourConstructor>` instead.

A utility type to extract the final, dependency-injected function type from a
constructor. This is especially useful for creating **type-safe mock functions
for your tests**.

```typescript
import { defineFn, required } from "@nakanoaas/injecfn";

interface Emailer {
  send(to: string, subject: string): Promise<void>;
}

// Given a function constructor...
const constructSendEmail = defineFn(
  { emailer: required<Emailer>() },
  ({ emailer }, to: string, subject: string) => emailer.send(to, subject),
);

// ...you can easily extract its precise function type using ReturnType.
type SendEmailFn = ReturnType<typeof constructSendEmail>;
//   ^? type SendEmailFn = (to: string, subject: string) => Promise<void>

// This lets you create a fully type-safe mock without re-writing the signature.
// TypeScript will ensure your mock matches the real function's parameters and return type.
const mockSendEmail: SendEmailFn = async (to, subject) => {
  console.log(`Mock email to ${to} with subject "${subject}"`);
};
```

## License

This project is licensed under the [MIT License](LICENSE).
