import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
    input: "feeder.js",
    output: { file: "feeder.bundled.js", format: "esm" },
    plugins: [resolve(), commonjs()],
};
