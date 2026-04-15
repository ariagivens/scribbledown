import type { ZipEntry } from "./zip";

export interface MessageRequest {
    readonly kind: "MessageRequest";
}

export interface MessageResponse {
    readonly kind: "MessageResponse";
}

function sendMessage(message: MessageRequest): Promise<unknown> {
    return browser.runtime.sendMessage(message);
}

export class CrossOriginFetchRequest implements MessageRequest {
    readonly kind = "MessageRequest";
    readonly input: string | URL | Request;
    readonly init?: RequestInit;

    constructor(input: string | URL | Request, init?: RequestInit) {
        this.input = input;
        if (init) {
            this.init = init;
        }
    }

    static uuid: string = "a64a49e7-6ff7-432a-b4b2-686a9fccb07e";
    readonly uuid: string = CrossOriginFetchRequest.uuid;
    static [Symbol.hasInstance](instance: unknown): boolean {
        return (
            instance !== null &&
            typeof instance === "object" &&
            "uuid" in instance &&
            instance.uuid === this.uuid
        );
    }
}

type ClonableResponse = {
    body: ArrayBuffer;
    status: number;
    status_text: string;
    headers_init: Record<string, string>;
};

export class CrossOriginFetchResponse implements MessageResponse {
    readonly kind = "MessageResponse";
    readonly response: ClonableResponse;

    constructor(response: ClonableResponse) {
        this.response = response;
    }

    static uuid: string = "29d67936-90ba-432c-b3ab-c927e1645641";
    readonly uuid: string = CrossOriginFetchResponse.uuid;
    static [Symbol.hasInstance](instance: unknown): boolean {
        return (
            instance !== null &&
            typeof instance === "object" &&
            "uuid" in instance &&
            instance.uuid === this.uuid
        );
    }
}

export async function cross_origin_fetch(
    input: string | URL | Request,
    init?: RequestInit,
): Promise<Response> {
    const response = await sendMessage(
        new CrossOriginFetchRequest(input, init),
    );
    if (response instanceof CrossOriginFetchResponse) {
        return new Response(response.response.body, {
            status: response.response.status,
            statusText: response.response.status_text,
            headers: response.response.headers_init,
        });
    } else {
        throw new Error(
            "Expected a CrossOriginFetchResponse, but got " + response,
        );
    }
}

export class GenerateZipRequest implements MessageRequest {
    readonly kind = "MessageRequest";
    readonly entries: ZipEntry[];
    readonly mimetype: string | undefined;

    constructor(content: ZipEntry[], mimetype: string | undefined) {
        this.entries = content;
        this.mimetype = mimetype;
    }

    static uuid: string = "5f819191-b4ae-4d00-a598-f75f7a1da555";
    readonly uuid: string = GenerateZipRequest.uuid;
    static [Symbol.hasInstance](instance: unknown): boolean {
        return (
            instance !== null &&
            typeof instance === "object" &&
            "uuid" in instance &&
            instance.uuid === this.uuid
        );
    }
}

export class GenerateZipResponse implements MessageResponse {
    readonly kind = "MessageResponse";
    readonly blob: Blob;

    constructor(blob: Blob) {
        this.blob = blob;
    }

    static uuid: string = "29d67936-90ba-432c-b3ab-c927e1645641";
    readonly uuid: string = GenerateZipResponse.uuid;
    static [Symbol.hasInstance](instance: unknown): boolean {
        return (
            instance !== null &&
            typeof instance === "object" &&
            "uuid" in instance &&
            instance.uuid === this.uuid
        );
    }
}

export async function generate_zip(
    content: ZipEntry[],
    mimetype: string | undefined,
): Promise<Blob> {
    const response = await sendMessage(
        new GenerateZipRequest(content, mimetype),
    );
    if (response instanceof GenerateZipResponse) {
        return response.blob;
    } else {
        throw new Error("Expected a GenerateZipResponse, but got " + response);
    }
}
