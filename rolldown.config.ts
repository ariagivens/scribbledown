import { defineConfig } from "rolldown";

export default defineConfig({
    input: "src/content_script.ts",
    output: {
        file: "dist/content_script.js",
    },
});
