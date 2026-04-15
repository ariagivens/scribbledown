import { defineConfig } from "rolldown";
import HandlebarsPrecompiler from "rollup-plugin-handlebars-precompiler";
import copy from "rollup-plugin-copy";

export default defineConfig([
    {
        input: "src/content_script.ts",
        output: {
            file: "dist/content_script.js",
            format: "module",
        },
        plugins: [
            HandlebarsPrecompiler({}),
            copy({
                targets: [
                    { src: "src/manifest.json", dest: "dist" },
                    { src: "src/content_script.css", dest: "dist" },
                    { src: "src/fonts/*.ttf", dest: "dist/fonts" },
                ],
            }),
        ],
        transform: {
            define: { "import.meta": "{}" },
        },
    },
    {
        input: "src/background_script.ts",
        output: {
            file: "dist/background_script.js",
            format: "module",
        },
        transform: {
            define: { "import.meta": "{}" },
        },
    },
]);
