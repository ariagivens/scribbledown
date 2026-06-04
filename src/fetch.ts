import { cross_origin_fetch } from "./internal";

/**
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch|MDN Reference}
 *
 * If this is a request to www.scribblehub.com, performs a regular
 * `window.fetch` request. Otherwise, performs a fetch in a
 * background script to avoid CORS errors.
 * @param {string | URL | Request} resource - This defines the resource that you wish to fetch
 * @param {RequestInit} options - A `RequestInit` object containing any custom settings that you want to apply to the request.
 */
export default async function fetch(
    resource: string | URL | Request,
    options?: RequestInit,
): Promise<Response> {
    if (is_cross_origin(resource)) {
        return await cross_origin_fetch(resource, options);
    } else {
        return await window.fetch(resource, options);
    }
}

const hostname = "www.scribblehub.com";

function is_cross_origin(input: string | URL | Request): boolean {
    const url = get_url(input);
    return url.hostname !== hostname;
}

function get_url(input: string | URL | Request): URL {
    if (typeof input === "string") {
        return new URL(input);
    } else if (input instanceof URL) {
        return input;
    } else {
        return new URL(input.url);
    }
}
