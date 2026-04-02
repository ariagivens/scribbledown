import type { Chapter } from "./chapter";
import container_xml from "./container.xml.txt";
import { RawTemplate as package_opf_template } from "./package.opf.hbs";
import { RawTemplate as nav_xhtml_template } from "./nav.xhtml.hbs";
import { RawTemplate as chapter_xhtml_template } from "./chapter.xhtml.hbs";
import { RawTemplate as fonts_css_template } from "./fonts.css.hbs";
import ofl_txt from "./fonts/OFL.txt";
import { RawTemplate as style_css_template } from "./style.css.hbs";

import JSZip from "jszip";

type Font = {
    identifier: string;
    family: string;
    style: string;
    weight: string;
    src: string;
};

const fonts: Font[] = [
    {
        identifier: "ah-r",
        family: "Atkinson Hyperlegible",
        style: "normal",
        weight: "normal",
        src: "fonts/AtkinsonHyperlegible-Regular.ttf",
    },
    {
        identifier: "ah-i",
        family: "Atkinson Hyperlegible",
        style: "italic",
        weight: "normal",
        src: "fonts/AtkinsonHyperlegible-Italic.ttf",
    },
    {
        identifier: "ah-b",
        family: "Atkinson Hyperlegible",
        style: "normal",
        weight: "bold",
        src: "fonts/AtkinsonHyperlegible-Bold.ttf",
    },
    {
        identifier: "ah-bi",
        family: "Atkinson Hyperlegible",
        style: "italic",
        weight: "bold",
        src: "fonts/AtkinsonHyperlegible-BoldItalic.ttf",
    },
];

function add_metadata(
    zip: JSZip,
    chapters: Chapter[],
    title: string,
    uid: string,
) {
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
    zip.file("META-INF/container.xml", container_xml);
    zip.file(
        "OEBPS/package.opf",
        package_opf_template({ chapters, title, uid, fonts }),
    );
    zip.file("OEBPS/nav.xhtml", nav_xhtml_template({ chapters, title }));
}

function add_content(zip: JSZip, chapters: Chapter[]) {
    for (const chapter of chapters) {
        zip.file(
            "OEBPS/" + chapter.identifier + ".xhtml",
            chapter_xhtml_template(chapter),
        );
    }
}

async function add_fonts(zip: JSZip) {
    zip.file("OEBPS/fonts.css", fonts_css_template({ fonts }));
    for (const { src } of fonts) {
        const response = await fetch(browser.runtime.getURL(src));
        if (!response.ok) {
            throw new Error("Failed to load font");
        }
        const font = await response.arrayBuffer();
        console.log(font);
        zip.file("OEBPS/" + src, font);
    }
    zip.file("OEBPS/fonts/ofl.txt", ofl_txt);
}

function add_style(zip: JSZip) {
    zip.file(
        "OEBPS/style.css",
        style_css_template({ font_family: "Atkinson Hyperlegible" }),
    );
}

export async function create_epub(
    chapters: Chapter[],
    title: string,
    uid: string,
) {
    const zip = new JSZip();
    add_metadata(zip, chapters, title, uid);
    add_content(zip, chapters);
    await add_fonts(zip);
    add_style(zip);
    return await zip.generateAsync({ type: "blob" });
}
