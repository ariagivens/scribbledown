import type { Chapter } from "./chapter";
import type { Title } from "./title";
import type { Cover, Author, Copyright } from "./content_script";
import container_xml from "./container.xml.txt";
import { RawTemplate as package_opf_template } from "./package.opf.hbs";
import { RawTemplate as nav_xhtml_template } from "./nav.xhtml.hbs";
import { RawTemplate as chapter_xhtml_template } from "./chapter.xhtml.hbs";
import { RawTemplate as fonts_css_template } from "./fonts.css.hbs";
import { RawTemplate as cover_xhtml_template } from "./cover.xhtml.hbs";
import { RawTemplate as title_xhtml_template } from "./title.xhtml.hbs";
import { RawTemplate as copyright_xhtml_template } from "./copyright.xhtml.hbs";
import ofl_txt from "./fonts/OFL.txt";
import { RawTemplate as style_css_template } from "./style.css.hbs";
import { Zip } from "./zip";
import { fulltitle } from "./title";

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
    zip: Zip,
    chapters: Chapter[],
    title: Title,
    uid: string,
    author: Author,
    cover: Cover,
) {
    zip.add("META-INF/container.xml", container_xml);
    zip.add(
        "OEBPS/package.opf",
        package_opf_template({
            chapters,
            title,
            uid,
            fonts,
            author,
            cover,
            fulltitle: fulltitle(title),
        }),
    );
    zip.add("OEBPS/nav.xhtml", nav_xhtml_template({ chapters, title }));
}

function add_front_matter(
    zip: Zip,
    cover: Cover,
    title: Title,
    author: Author,
    copyright: Copyright,
) {
    zip.add(`OEBPS/cover.${cover.extension}`, cover.image);
    zip.add("OEBPS/cover.xhtml", cover_xhtml_template({ cover, title }));
    zip.add("OEBPS/title.xhtml", title_xhtml_template({ author, title }));
    zip.add("OEBPS/copyright.xhtml", copyright_xhtml_template({ copyright }));
}

function add_content(zip: Zip, chapters: Chapter[]) {
    for (const chapter of chapters) {
        zip.add(
            "OEBPS/" + chapter.identifier + ".xhtml",
            chapter_xhtml_template(chapter),
        );
    }
}

async function add_fonts(zip: Zip) {
    zip.add("OEBPS/fonts.css", fonts_css_template({ fonts }));
    for (const { src } of fonts) {
        const response = await fetch(browser.runtime.getURL(src));
        if (!response.ok) {
            throw new Error("Failed to load font");
        }
        const font = await response.blob();
        zip.add("OEBPS/" + src, font);
    }
    zip.add("OEBPS/fonts/ofl.txt", ofl_txt);
}

function add_style(zip: Zip) {
    zip.add(
        "OEBPS/style.css",
        style_css_template({ font_family: "Atkinson Hyperlegible" }),
    );
}

export async function create_epub(
    chapters: Chapter[],
    title: Title,
    uid: string,
    author: Author,
    cover: Cover,
    copyright: Copyright,
): Promise<Blob> {
    const zip = new Zip("application/epub+zip");
    add_metadata(zip, chapters, title, uid, author, cover);
    add_front_matter(zip, cover, title, author, copyright);
    add_content(zip, chapters);
    await add_fonts(zip);
    add_style(zip);
    return await zip.generate();
}
