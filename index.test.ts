import { injecfn } from "./index.ts";
import { describe, it } from "https://deno.land/std@0.207.0/testing/bdd.ts";
import { assertEquals } from "https://deno.land/std@0.207.0/assert/mod.ts";

describe("injecfn", () => {
  describe("fn", () => {
    it("should correctly inject dependencies and arguments", () => {
      const constructSum = injecfn<{ factor: number }>().fn(
        ({ factor }: { factor: number }, a: number, b: number) =>
          factor * (a + b),
      );

      const sumWithFactor2 = constructSum({ factor: 2 });
      assertEquals(sumWithFactor2(3, 4), 14);

      const sumWithFactor5 = constructSum({ factor: 5 });
      assertEquals(sumWithFactor5(1, 2), 15);
    });

    it("should work with no dependencies", () => {
      const constructConcat = injecfn().fn(
        (_deps: unknown, a: string, b: string) => a + b,
      );
      const concat = constructConcat({}); // or constructConcat(undefined)
      assertEquals(concat("hello", "world"), "helloworld");
    });

    it("should work with no dependencies and no arguments", () => {
      const constructHelloWorld = injecfn().fn(() => "hello world");
      const helloWorld = constructHelloWorld({});
      assertEquals(helloWorld(), "hello world");
    });
  });

  describe("fnWithDefaults", () => {
    type GreetingRequires = { name: string };
    type GreetingDefaults = { suffix: string };
    type GreetingDeps = GreetingRequires & GreetingDefaults;

    it("should use default dependencies when not provided", () => {
      const constructGreeting = injecfn<GreetingRequires>()
        .fnWithDefaults(
          { suffix: "!" } as GreetingDefaults,
          (
            { name, suffix }: GreetingDeps,
            salutation: string,
          ) => `${salutation}, ${name}${suffix}`,
        );

      const greetJohn = constructGreeting({ name: "John" });
      assertEquals(greetJohn("Hello"), "Hello, John!");
    });

    it("should override default dependencies when provided as object", () => {
      const constructGreeting = injecfn<GreetingRequires>()
        .fnWithDefaults(
          { suffix: "!" } as GreetingDefaults,
          (
            { name, suffix }: GreetingDeps,
            salutation: string,
          ) => `${salutation}, ${name}${suffix}`,
        );

      const greetJaneWithQuestion = constructGreeting({
        name: "Jane",
        suffix: "?", // Overrides default
      });
      assertEquals(greetJaneWithQuestion("Hi"), "Hi, Jane?");
    });

    type DerivedGreetingRequires = { baseName: string };
    type DerivedGreetingDefaults = { defaultSuffix: string };
    type DerivedGreetingDeps =
      & DerivedGreetingRequires
      & DerivedGreetingDefaults;

    it("should derive dependencies when provided as function", () => {
      const constructGreeting = injecfn<DerivedGreetingRequires>()
        .fnWithDefaults(
          { defaultSuffix: "!" } as DerivedGreetingDefaults,
          (
            { baseName, defaultSuffix }: DerivedGreetingDeps,
            salutation: string,
          ) => {
            const name = baseName.toUpperCase();
            const suffix = defaultSuffix;
            return `${salutation}, ${name}${suffix}`;
          },
        );

      const greetViaFunction = constructGreeting(
        (_defaults: DerivedGreetingDefaults) => ({
          baseName: "Alice",
          // defaultSuffix will be merged from defaults
        }),
      );
      assertEquals(greetViaFunction("Welcome"), "Welcome, ALICE!");
    });

    type AdvancedGreetingRequires = { name: string };
    type AdvancedGreetingDefaults = { suffix: string; prefix: string };
    type AdvancedGreetingDeps =
      & AdvancedGreetingRequires
      & AdvancedGreetingDefaults;

    it("should override defaults when deps function provides overlapping values", () => {
      const constructAdvancedGreeting = injecfn<AdvancedGreetingRequires>()
        .fnWithDefaults(
          { suffix: "!", prefix: "Dear " } as AdvancedGreetingDefaults,
          (
            { name, suffix, prefix }: AdvancedGreetingDeps,
            salutation: string,
          ) => `${salutation} ${prefix}${name}${suffix}`,
        );

      const greetBob = constructAdvancedGreeting(
        (_defaults: AdvancedGreetingDefaults) => ({
          name: "Bob",
          suffix: ".", // Override default "!"
          // prefix will use defaults.prefix "Dear "
        }),
      );
      assertEquals(greetBob("Greetings"), "Greetings Dear Bob.");
    });

    type DefaultMessageDefaults = { message: string };
    type DefaultMessageDeps = DefaultMessageDefaults;

    it("should work with no required dependencies but with defaults", () => {
      const constructDefaultMessage = injecfn()
        .fnWithDefaults(
          { message: "default message" } as DefaultMessageDefaults,
          ({ message }: DefaultMessageDeps, prefix: string) =>
            `${prefix}: ${message}`,
        );

      const msg1 = constructDefaultMessage({});
      assertEquals(msg1("Info"), "Info: default message");

      const msg2 = constructDefaultMessage({ message: "override" });
      assertEquals(msg2("Warn"), "Warn: override");
    });

    type ComplexRequires = { req1: number; req2: string };
    type ComplexDefaults = { def1: string; def2: number };
    type ComplexDeps = ComplexRequires & ComplexDefaults;

    it("complex scenario from user example", () => {
      const constructTestFn = injecfn<ComplexRequires>()
        .fnWithDefaults(
          { def1: "foo", def2: 1 } as ComplexDefaults,
          (
            { req1, req2, def1, def2 }: ComplexDeps,
            arg1: number,
            arg2: string,
          ) => {
            return `${req1} ${req2} ${def1} ${def2} ${arg1} ${arg2}`;
          },
        );

      const testFn1 = constructTestFn({ req1: 1, req2: "bar" });
      assertEquals(testFn1(100, "hello"), "1 bar foo 1 100 hello");

      const testFn2 = constructTestFn((d: ComplexDefaults) => ({
        req1: d.def1.length,
        req2: "baz",
      }));
      assertEquals(testFn2(200, "world"), "3 baz foo 1 200 world");
    });
  });
});
