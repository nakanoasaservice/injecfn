# injecfn ⚡

**Effortless, Type-Safe Dependency Injection for Functions.**

[![JSR](https://jsr.io/badges/@nakanoaas/injecfn)](https://jsr.io/@nakanoaas/injecfn)
[![npm](https://badge.fury.io/js/@nakanoaas%2Finjecfn.svg)](https://badge.fury.io/js/@nakanoaas%2Finjecfn)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/nakanoaas/injecfn/blob/main/LICENSE)

---

## What is `injecfn`?

Tired of functions with messy signatures that mix essential dependencies with
optional configurations? `injecfn` helps you cleanly separate what a function
**requires** from what it **can** use with sensible defaults. This makes your
code more modular, testable, and easier to use.

**The Problem:** Functions often need a mix of dependencies. Some are essential
(`paymentProcessor`), while others are good to have but can be defaulted
(`logger`). This can lead to complex signatures and call sites.

```typescript
// A traditional function with mixed concerns in its signature.
function processOrder(
  order: Order,
  paymentProcessor: PaymentProcessor,
  logger: Logger = console, // Optional args can make things messy.
) {
  logger.log(`Processing order ${order.id}`);
  paymentProcessor.charge(order.amount);
}

// Call sites require careful argument positioning or configuration objects.
processOrder(myOrder, stripeProcessor);
processOrder(myOrder, stripeProcessor, customLogger);
```

**The `injecfn` Solution:** Decouple the function's logic from its dependency
resolution.

```typescript
import { injecfn } from "injecfn";

// 1. Define your dependency types
interface PaymentProcessor {
  charge(amount: number): void;
}
interface Logger {
  log(message: string): void;
}

// 2. Create a constructor, specifying ONLY the types for required dependencies.
const constructProcessOrder = injecfn<{
  paymentProcessor: PaymentProcessor;
}>().fnWithDefaults(
  // 3. Provide default implementations. Their types are inferred automatically!
  {
    logger: console as Logger,
  },
  // 4. Write your core logic, decoupled from the outside world.
  ({ paymentProcessor, logger }, order: Order) => {
    logger.log(`Processing order ${order.id}`);
    paymentProcessor.charge(order.amount);
  },
);

// --- At instantiation time, things are much cleaner ---

// You ONLY need to provide the required `paymentProcessor`. `logger` is optional.
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

Notice the clarity: Required dependencies are enforced by the type system, while
optional ones are handled gracefully with type inference. This makes your
functions robust and a pleasure to use.

## Features

- ✅ **Type-Safe:** Required dependencies are enforced by type checking.
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
