import { generate_zip } from "./internal";

export type Content = string | Blob;

export type ZipEntry = {
    filename: string;
    content: Content;
};

export class Zip {
    #entries: ZipEntry[] = [];
    #mimetype: string | undefined;

    constructor(mimetype?: string) {
        this.#mimetype = mimetype;
    }

    add(filename: string, content: Content) {
        this.#entries.push({ filename, content });
    }

    async generate(): Promise<Blob> {
        return await generate_zip(this.#entries, this.#mimetype);
    }
}
