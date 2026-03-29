import { Chapter } from "./chapter";
import container_xml from "./container.xml.txt";
import { RawTemplate as package_opf_template } from "./package.opf.hbs";
import { RawTemplate as nav_xhtml_template } from "./nav.xhtml.hbs";
import { RawTemplate as content_xhtml_template } from "./content.xhtml.hbs";

import JSZip from "jszip";

export async function create_epub(
    chapters: Chapter[],
    title: string,
    uid: string,
) {
    const zip = new JSZip();
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
    zip.file("META-INF/container.xml", container_xml);
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
