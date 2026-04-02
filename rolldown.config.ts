import { defineConfig } from "rolldown";
import HandlebarsPrecompiler from "rollup-plugin-handlebars-precompiler";
import copy from "rollup-plugin-copy";

export default defineConfig({
    input: "src/content_script.ts",
    output: {
        file: "dist/content_script.js",
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
});
