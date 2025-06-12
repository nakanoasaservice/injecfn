import { build, emptyDir } from "@deno/dnt";

await emptyDir("./dist");

interface Config {
  name: string;
  version: string;
  license: string;
  compilerOptions: { [key: string]: boolean };
}

const jsrJson = await Deno.readTextFile("./deno.json");
const config: Config = JSON.parse(jsrJson);

await build({
  entryPoints: ["./index.ts"],
  outDir: "./dist",
  shims: {
    deno: false,
  },

  test: false,
  compilerOptions: {
    ...config.compilerOptions,
    target: "ES2015",
    lib: ["ES2015"],
  },

  package: {
    // package.json properties
    name: config.name,
    version: config.version,
    license: config.license,
    sideEffects: false,
    description: "Effortless, Type-Safe Dependency Injection for Functions.",
    repository: {
      type: "git",
      url: "git://github.com/nakanoasaservice/injecfn.git",
    },
    bugs: {
      url: "https://github.com/nakanoasaservice/injecfn/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "dist/LICENSE");
    Deno.copyFileSync("README.md", "dist/README.md");
  },
});
