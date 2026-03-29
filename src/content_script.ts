import { get_chapter_refs } from "./chapter_ref";
import { get_chapters, Chapter } from "./chapter";
import container_xml from "./container.xml.txt";
import { RawTemplate as package_opf_template } from "./package.opf.hbs";
import { RawTemplate as nav_xhtml_template } from "./nav.xhtml.hbs";
import { RawTemplate as content_xhtml_template } from "./content.xhtml.hbs";

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";

async function to_epub(chapters: Chapter[]) {
    const zip = new JSZip();
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
    zip.file("META-INF/container.xml", container_xml);
    const title = "Work title";
    const uid = uuidv4();
    const package_opf = package_opf_template({ title, uid });
    const nav_xhtml = nav_xhtml_template({ title, chapters });
    const content_xhtml = content_xhtml_template({ title, chapters });
    const oebps = zip.folder("OEBPS");
    if (!oebps) {
        throw new Error("Failed to create directory");
    }
    oebps.file("package.opf", package_opf);
    oebps.file("nav.xhtml", nav_xhtml);
    oebps.file("content.xhtml", content_xhtml);

    return await zip.generateAsync({ type: "blob" });
}

async function download() {
    const chapter_refs = await get_chapter_refs();
    const chapters = await get_chapters(chapter_refs);
    const epub = await to_epub(chapters);
    saveAs(epub, "test.epub");
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
