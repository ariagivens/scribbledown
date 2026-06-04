import fetch from "./fetch";
import {
    CrossOriginFetchResponse,
    type MessageResponse,
    CrossOriginFetchRequest,
    GenerateZipRequest,
    GenerateZipResponse,
} from "./internal";

import { BlobReader, BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";

async function cross_origin_fetch(
    request: CrossOriginFetchRequest,
): Promise<CrossOriginFetchResponse> {
    const response = await fetch(request.input, request.init);
    const body = await response.arrayBuffer();
    const status = response.status;
    const status_text = response.statusText;
    const headers_init: Record<string, string> = {};
    for (const [key, value] of response.headers.entries()) {
        headers_init[key] = value;
    }
    return new CrossOriginFetchResponse({
        body,
        status,
        status_text,
        headers_init,
    });
}

async function generate_zip(
    request: GenerateZipRequest,
): Promise<GenerateZipResponse> {
    const zip = new ZipWriter(new BlobWriter(request.mimetype), {
        useWebWorkers: false,
    });
    for (const { filename, content } of request.entries) {
        if (typeof content === "string") {
            await zip.add(filename, new TextReader(content));
        } else {
            await zip.add(filename, new BlobReader(content));
        }
    }
    const blob = await zip.close();
    return new GenerateZipResponse(blob);
}

function handle_message(request: unknown): Promise<MessageResponse> {
    if (request instanceof CrossOriginFetchRequest) {
        return cross_origin_fetch(request);
    } else if (request instanceof GenerateZipRequest) {
        return generate_zip(request);
    } else {
        throw new Error("Unknown request type: " + request);
    }
}

browser.runtime.onMessage.addListener(handle_message);
