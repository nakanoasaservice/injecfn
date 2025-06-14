import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { type Constructed, defineFn, required } from "./index.ts";

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

describe("defineFn", () => {
  describe("with only required dependencies", () => {
    it("should construct a function that receives dependencies", () => {
      const construct = defineFn(
        { serviceA: required<ServiceA>() },
        ({ serviceA }) => serviceA.methodA(),
      );

      const serviceA: ServiceA = {
        methodA: () => "result from A",
      };

      const myFunc = construct({ serviceA });

      expect(myFunc()).toBe("result from A");
    });

    it("should construct a function with arguments", () => {
      const construct = defineFn(
        { serviceB: required<ServiceB>() },
        ({ serviceB }, name: string) => serviceB.methodB(name),
      );

      const serviceB: ServiceB = {
        methodB: (s) => `Hello, ${s}`,
      };

      const myFunc = construct({ serviceB });

      expect(myFunc("World")).toBe("Hello, World");
    });
  });

  describe("with only default dependencies", () => {
    it("should use default dependencies when constructor is called without args", () => {
      const mockLogger = createMockLogger();

      const construct = defineFn(
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

      const myFunc = construct(); // No arguments needed
      const result = myFunc("Default");

      expect(result).toBe("Hi, Default");
      expect(mockLogger.history).toEqual(["Hi, Default"]);
    });

    it("should allow overriding default dependencies", () => {
      const defaultLogger = createMockLogger();
      const customLogger = createMockLogger();

      const construct = defineFn(
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
  });

  describe("with mixed required and default dependencies", () => {
    it("should merge required and default dependencies correctly", () => {
      const mockLogger = createMockLogger();

      const construct = defineFn(
        {
          serviceB: required<ServiceB>(),
          logger: mockLogger,
        },
        ({ serviceB, logger }, text: string) => {
          const msg = serviceB.methodB(text);
          logger.log(msg);
        },
      );

      const serviceB: ServiceB = {
        methodB: (s) => `ServiceB says: ${s}`,
      };

      // Provide only the required dependency
      const myFunc = construct({ serviceB });
      myFunc("Test");

      expect(mockLogger.history).toEqual(["ServiceB says: Test"]);
    });

    it("should allow overriding defaults while providing required dependencies", () => {
      const defaultLogger = createMockLogger();
      const customLogger = createMockLogger();

      const construct = defineFn(
        {
          serviceB: required<ServiceB>(),
          logger: defaultLogger,
        },
        ({ serviceB, logger }, text: string) => {
          const msg = serviceB.methodB(text);
          logger.log(msg);
        },
      );

      const serviceB: ServiceB = {
        methodB: (s) => `ServiceB says: ${s}`,
      };

      // Provide the required dependency and override the default one
      const myFunc = construct({ serviceB, logger: customLogger });
      myFunc("Test with override");

      expect(defaultLogger.history).toEqual([]);
      expect(customLogger.history).toEqual([
        "ServiceB says: Test with override",
      ]);
    });
  });

  describe("Constructed type helper", () => {
    it("should correctly infer the function type", () => {
      // This test primarily serves as a compile-time check to ensure the
      // Constructed type utility works as expected.
      const construct = defineFn(
        { serviceA: required<ServiceA>() },
        ({ serviceA }) => serviceA.methodA(),
      );

      // `MyFuncType` is inferred as `() => string`
      type MyFuncType = Constructed<typeof construct>;

      const serviceA: ServiceA = {
        methodA: () => "type test",
      };

      const myFunc: MyFuncType = construct({ serviceA });

      const result: string = myFunc();
      expect(result).toBe("type test");

      // @ts-expect-error myFunc should not accept arguments
      myFunc("should fail");
    });
  });
});
