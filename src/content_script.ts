import { get_chapter_refs } from "./chapter_ref";
import { get_chapters } from "./chapter";
import { create_epub } from "./epub";

import { v4 as uuidv4 } from "uuid";
import sanitize from "sanitize-filename";
import { saveAs } from "file-saver";

function get_title(): string {
    return (
        document.querySelector<HTMLMetaElement>("meta[property='og:title']")
            ?.content ?? "Untitled"
    );
}

async function download() {
    const chapter_refs = await get_chapter_refs();
    const chapters = await get_chapters(chapter_refs);
    const title = get_title();
    const uid = uuidv4();
    const epub = await create_epub(chapters, title, uid);
    saveAs(epub, sanitize(title) + ".epub");
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
