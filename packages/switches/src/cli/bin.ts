/// <reference types="node" />
// `npx switches ...`. The shebang is added by tsup (banner) for dist/cli.js.
import { main } from "./main";

process.exitCode = main(process.argv.slice(2), process.cwd(), {
  out: (line) => console.log(line),
  err: (line) => console.error(line),
});
