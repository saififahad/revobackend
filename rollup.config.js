import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";

export default {
  input: "app.js", // Entry point of your backend code
  output: {
    file: "dist/bundle.js", // Output bundle file
    format: "cjs", // CommonJS format for Node.js
  },
  plugins: [
    resolve(), // Resolve Node.js modules
    commonjs(), // Convert CommonJS modules to ES6
    json(), // Allow importing JSON files
    terser(), // Minify the output bundle
  ],
  external: ["express"], // Ensure Express is not bundled
};
