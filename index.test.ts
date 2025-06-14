import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { type Constructed, defineFn, required } from "./index.ts";

// --- Test Setup: Mocks and Interfaces ---

interface ServiceA {
  methodA(): string;
}

interface ServiceB {
  methodB(s: string): string;
}

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

const mockServiceA: ServiceA = {
  methodA: () => "from service A",
};

const mockServiceB: ServiceB = {
  methodB: (s) => `ServiceB says: ${s}`,
};

// --- Test Suite ---

describe("defineFn", () => {
  describe("Core Behavior", () => {
    it("should create a constructor that produces a dependency-injected function", () => {
      const construct = defineFn(
        { serviceA: required<ServiceA>() },
        ({ serviceA }) => serviceA.methodA(),
      );
      const myFunc = construct({ serviceA: mockServiceA });

      expect(myFunc()).toBe("from service A");
    });

    it("should correctly pass runtime arguments to the final function", () => {
      const construct = defineFn(
        { serviceB: required<ServiceB>() },
        ({ serviceB }, greeting: string, name: string) =>
          serviceB.methodB(`${greeting}, ${name}`),
      );
      const myFunc = construct({ serviceB: mockServiceB });

      expect(myFunc("Hello", "World")).toBe("ServiceB says: Hello, World");
    });
  });

  describe("Dependency Resolution", () => {
    describe("With default dependencies", () => {
      it("should use default values if no overrides are provided", () => {
        const mockLogger = createMockLogger();
        const construct = defineFn(
          { logger: mockLogger },
          ({ logger }) => logger.log("default call"),
        );

        const myFunc = construct(); // Called without arguments
        myFunc();

        expect(mockLogger.history).toEqual(["default call"]);
      });

      it("should allow overriding default dependencies", () => {
        const defaultLogger = createMockLogger();
        const customLogger = createMockLogger();
        const construct = defineFn(
          { logger: defaultLogger },
          ({ logger }) => logger.log("message"),
        );

        const myFunc = construct({ logger: customLogger });
        myFunc();

        expect(defaultLogger.history).toEqual([]);
        expect(customLogger.history).toEqual(["message"]);
      });
    });

    describe("With mixed dependencies", () => {
      it("should resolve a mix of required and default dependencies", () => {
        const mockLogger = createMockLogger();
        const construct = defineFn(
          {
            serviceB: required<ServiceB>(),
            logger: mockLogger,
          },
          ({ serviceB, logger }, text: string) => {
            logger.log(serviceB.methodB(text));
          },
        );

        const myFunc = construct({ serviceB: mockServiceB }); // Only required deps provided
        myFunc("mixed test");

        expect(mockLogger.history).toEqual(["ServiceB says: mixed test"]);
      });

      it("should allow overriding defaults while satisfying required dependencies", () => {
        const defaultLogger = createMockLogger();
        const customLogger = createMockLogger();
        const construct = defineFn(
          {
            serviceB: required<ServiceB>(),
            logger: defaultLogger,
          },
          ({ serviceB, logger }, text: string) => {
            logger.log(serviceB.methodB(text));
          },
        );

        const myFunc = construct({
          serviceB: mockServiceB,
          logger: customLogger,
        });
        myFunc("override test");

        expect(defaultLogger.history).toEqual([]);
        expect(customLogger.history).toEqual(["ServiceB says: override test"]);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle `null` and `undefined` as valid dependency values", () => {
      const construct = defineFn(
        {
          depA: null,
          depB: required<string | undefined>(),
        },
        ({ depA, depB }) => ({ depA, depB }),
      );

      const myFunc = construct({ depB: undefined });
      expect(myFunc()).toEqual({ depA: null, depB: undefined });
    });

    it("should ignore extraneous properties passed to the constructor", () => {
      const construct = defineFn(
        { serviceA: required<ServiceA>() },
        ({ serviceA }) => serviceA.methodA(),
      );

      // Pass an extra property, which should be ignored
      const myFunc = construct({
        serviceA: mockServiceA,
        extra: "value",
      } as any);

      expect(myFunc()).toBe("from service A");
    });
  });

  describe("Type System Integration", () => {
    it("should infer dependency types correctly inside the implementation", () => {
      // This is a compile-time test. If it compiles without errors, it passes.
      const construct = defineFn(
        {
          serviceA: required<ServiceA>(),
          logger: createMockLogger(),
        },
        (deps) => {
          const result: string = deps.serviceA.methodA();
          deps.logger.log(result);
        },
      );
      // Runtime check to ensure it actually works
      const myFunc = construct({ serviceA: mockServiceA });
      expect(myFunc).toBeInstanceOf(Function);
    });

    it("`Constructed` utility should correctly infer the final function's signature", () => {
      const construct = defineFn(
        { serviceA: required<ServiceA>() },
        (_deps, name: string): string => `Hello, ${name}`,
      );
      type MyFunc = Constructed<typeof construct>;

      // `myFunc` should be typed as `(name: string) => string`
      const myFunc: MyFunc = construct({ serviceA: mockServiceA });
      const result: string = myFunc("World");
      expect(result).toBe("Hello, World");

      // @ts-expect-error The function should require one argument.
      myFunc();
      // @ts-expect-error The argument should be a string.
      myFunc(123);
    });

    it("should produce a type error if a required dependency is missing", () => {
      const construct = defineFn(
        { serviceA: required<ServiceA>() },
        () => {},
      );

      // @ts-expect-error Property 'serviceA' is missing.
      construct({});
    });

    it("should produce a type error if an override has the wrong type", () => {
      const construct = defineFn({ serviceA: mockServiceA }, () => {});

      // @ts-expect-error Type 'string' is not assignable to type 'ServiceA'.
      construct({ serviceA: "not a service" });
    });
  });
});
