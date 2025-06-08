import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { type Constructed, injecfn } from "./index.ts";

// Mocks and Interfaces for testing
interface ServiceA {
  methodA(): string;
}

interface ServiceB {
  methodB(s: string): string;
}

type Greeter = (name: string) => string;

interface Logger {
  log(message: string): void;
  history: string[];
}

const createMockLogger = (): Logger => ({
  history: [],
  log(message: string) {
    this.history.push(message);
  },
});

describe("injecfn", () => {
  describe("fn", () => {
    it("should construct a function that receives dependencies", () => {
      const construct = injecfn<{ serviceA: ServiceA }>().fn(
        ({ serviceA }) => serviceA.methodA(),
      );

      const serviceA: ServiceA = {
        methodA: () => "result from A",
      };

      const myFunc = construct({ serviceA });

      expect(myFunc()).toBe("result from A");
    });

    it("should construct a function with arguments", () => {
      const construct = injecfn<{ serviceB: ServiceB }>().fn(
        ({ serviceB }, name: string) => serviceB.methodB(name),
      );

      const serviceB: ServiceB = {
        methodB: (s) => `Hello, ${s}`,
      };

      const myFunc = construct({ serviceB });

      expect(myFunc("World")).toBe("Hello, World");
    });
  });

  describe("fnWithDefaults", () => {
    it("should use default dependencies when none are provided", () => {
      const mockLogger = createMockLogger();

      const construct = injecfn().fnWithDefaults(
        {
          greeter: (name: string) => `Hi, ${name}`,
          logger: mockLogger,
        },
        ({ greeter, logger }, name: string) => {
          const msg = greeter(name);
          logger.log(msg);
          return msg;
        },
      );

      const myFunc = construct({});
      const result = myFunc("Default");

      expect(result).toBe("Hi, Default");
      expect(mockLogger.history).toEqual(["Hi, Default"]);
    });

    it("should allow overriding default dependencies", () => {
      const defaultLogger = createMockLogger();
      const customLogger = createMockLogger();

      const construct = injecfn().fnWithDefaults(
        {
          greeter: (name: string) => `Hi, ${name}`,
          logger: defaultLogger,
        },
        ({ greeter, logger }, name: string) => {
          const msg = greeter(name);
          logger.log(msg);
          return msg;
        },
      );

      const myFunc = construct({
        greeter: (name: string) => `Yo, ${name}`,
        logger: customLogger,
      });

      const result = myFunc("Custom");

      expect(result).toBe("Yo, Custom");
      expect(defaultLogger.history).toEqual([]);
      expect(customLogger.history).toEqual(["Yo, Custom"]);
    });

    it("should merge required and default dependencies", () => {
      const mockLogger = createMockLogger();

      const construct = injecfn<{ serviceB: ServiceB }>().fnWithDefaults(
        { logger: mockLogger },
        ({ serviceB, logger }, text: string) => {
          const msg = serviceB.methodB(text);
          logger.log(msg);
        },
      );

      const serviceB: ServiceB = {
        methodB: (s) => `ServiceB says: ${s}`,
      };

      const myFunc = construct({ serviceB });
      myFunc("Test");

      expect(mockLogger.history).toEqual(["ServiceB says: Test"]);
    });

    it("should work with a function to create dependencies", () => {
      const defaultLogger = createMockLogger();
      const customLogger = createMockLogger();

      const construct = injecfn().fnWithDefaults(
        { logger: defaultLogger },
        ({ logger }, message: string) => {
          logger.log(message);
        },
      );

      const myFunc = construct((defaults) => {
        expect(defaults.logger).toBe(defaultLogger); // Check if we get the defaults
        return { logger: customLogger };
      });

      myFunc("message from function deps");

      expect(defaultLogger.history).toEqual([]);
      expect(customLogger.history).toEqual(["message from function deps"]);
    });
  });

  describe("Constructed type helper", () => {
    it("should correctly infer the function type", () => {
      // This test primarily serves as a compile-time check to ensure the
      // Constructed type utility works as expected. The runtime assertions
      // confirm that the function behaves correctly.

      const construct = injecfn<{ serviceA: ServiceA }>().fn(
        ({ serviceA }) => serviceA.methodA(),
      );

      type MyFuncType = Constructed<typeof construct>;

      const serviceA: ServiceA = {
        methodA: () => "type test",
      };

      // The 'myFunc' variable is now correctly typed as () => string
      const myFunc: MyFuncType = construct({ serviceA });

      const result: string = myFunc();
      expect(result).toBe("type test");

      // @ts-expect-error myFunc should not accept arguments
      myFunc("should fail");
    });
  });
});
