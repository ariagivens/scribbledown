import { defineConfig } from "rolldown";
import HandlebarsPrecompiler from "rollup-plugin-handlebars-precompiler";

export default defineConfig({
    input: "src/content_script.ts",
    output: {
        file: "dist/content_script.js",
    },
    plugins: [HandlebarsPrecompiler({})],
});
