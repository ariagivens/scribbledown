import { get_chapter_refs } from "./chapter_ref";
import { get_chapters } from "./chapter";
import { create_epub } from "./epub";

import { v4 as uuidv4 } from "uuid";
import sanitize from "sanitize-filename";
import { saveAs } from "file-saver";
import mime from "mime/lite";
import { cross_origin_fetch } from "./internal";

function get_title(): string {
    return (
        document.querySelector<HTMLMetaElement>("meta[property='og:title']")
            ?.content ?? "Untitled"
    );
}

export type Author = {
    name: string;
    url?: string;
};

function get_author(): Author {
    const author: Author = {
        name:
            document.querySelector<HTMLSpanElement>("span.auth_name_fic")
                ?.textContent ?? "Unknown",
    };
    const url = document.querySelector<HTMLAnchorElement>(".author a")?.href;
    if (url) {
        author.url = url;
    }
    return author;
}

export type Cover = {
    content_type: string;
    extension: string;
    image: Blob;
};

async function get_cover(): Promise<Cover> {
    const url =
        document.querySelector<HTMLImageElement>(".fic_image img")?.src ??
        "https://www.scribblehub.com/img/noimagefound.jpg";
    console.log(url);
    const response = await cross_origin_fetch(url, { method: "GET" });
    if (!response.ok) {
        throw new Error("Failed to download cover image.");
    }

    const content_type = response.headers.get("Content-Type") ?? "image/jpeg";
    const extension = mime.getExtension(content_type) ?? "jpg";
    const image = await response.blob();
    return { content_type, extension, image };
}

async function download() {
    const chapter_refs = await get_chapter_refs();
    const chapters = await get_chapters(chapter_refs);
    const title = get_title();
    const author = get_author();
    const cover = await get_cover();
    const uid = uuidv4();
    const epub = await create_epub(chapters, title, uid, author, cover);
    saveAs(epub, `${sanitize(title)} - ${sanitize(author.name)}.epub`);
}

const read_buttons = document.querySelector(".read_buttons");
if (read_buttons) {
    read_buttons.className = "sd_read_buttons";
    const download_button = document.createElement("a");
    const span = document.createElement("span");
    span.className = "btn_read";
    span.innerText = "Download";
    download_button.appendChild(span);
    download_button.onclick = download;
    read_buttons.appendChild(download_button);
}

const tip_icon = document.querySelector(".tip_icon");
if (tip_icon) {
    tip_icon.className = tip_icon.className.replace("tip_icon", "sd_tip_icon");
}
