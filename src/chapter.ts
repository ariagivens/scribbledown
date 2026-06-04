import type { ChapterRef } from "./chapter_ref";
import { lazy } from "@nfnitloop/better-iterators";
import * as cheerio from "cheerio";
import * as domhandler from "domhandler";
import type { Element } from "domhandler";
import fetch from "./fetch";

type RawChapter = {
    order: number;
    title: string;
    html: string;
};

export type Chapter = {
    order: number;
    title: string;
    identifier: string;
    paragraphs: string[];
};

export type ElementStyle = {
    emphasis: boolean;
    strong: boolean;
    underline: boolean;
    del: boolean;
};

type ParagraphSegment = {
    style: ElementStyle;
    content: string;
};

type ThematicBreak = {
    kind: "break";
    dinkus?: string;
};

type Paragraph = ParagraphSegment[] | ThematicBreak;

async function fetch_chapter_raws(
    chapter_refs: ChapterRef[],
): Promise<RawChapter[]> {
    const jitter = 500;
    const factor = 1.2;
    let backoff = 9000;
    return await lazy(chapter_refs)
        .toAsync()
        .map(async ({ title, order, link }) => {
            console.log("Chapter " + order);
            let response = await fetch(link, { method: "GET" });

            if (order !== chapter_refs.length) {
                await new Promise((r) =>
                    setTimeout(r, backoff + Math.random() * jitter),
                );
            }

            while (!response.ok && response.status == 403) {
                backoff *= factor;
                console.log("retrying ... (" + backoff + ")");
                response = await fetch(link, { method: "GET" });
                await new Promise((r) =>
                    setTimeout(r, backoff + Math.random() * jitter),
                );
            }

            if (!response.ok) {
                throw new Error("Error code: " + response.status);
            }

            return {
                title,
                order,
                html: await response.text(),
            };
        })
        .toArray();
}

function to_segments(
    el: Element,
    parentStyle: ElementStyle = {
        emphasis: false,
        strong: false,
        underline: false,
        del: false,
    },
): ParagraphSegment[] {
    let segments: ParagraphSegment[] = [];

    for (const child of el.children) {
        if (domhandler.isText(child)) {
            segments.push({
                style: parentStyle,
                content: child.data,
            });
        } else if (domhandler.isTag(child)) {
            switch (child.name) {
                case "span": {
                    segments = segments.concat(
                        to_segments(child, {
                            ...parentStyle,
                            underline:
                                child.attribs["style"] ===
                                "text-decoration:underline",
                        }),
                    );
                    break;
                }
                case "i":
                case "em": {
                    segments = segments.concat(
                        to_segments(child, {
                            ...parentStyle,
                            emphasis: true,
                        }),
                    );
                    break;
                }
                case "b":
                case "strong": {
                    segments = segments.concat(
                        to_segments(child, {
                            ...parentStyle,
                            strong: true,
                        }),
                    );
                    break;
                }
                case "del": {
                    segments = segments.concat(
                        to_segments(child, {
                            ...parentStyle,
                            del: true,
                        }),
                    );
                    break;
                }
                default: {
                    segments = segments.concat(to_segments(child));
                }
            }
        }
    }

    return segments;
}

// A line that contains only symbols that aren't alphanumeric or punctuation
const thematic_break_regex = /^[^\w.!?"'`“”«»‘’,‚‛“”„‟‹›⹂;]*$/;
function to_paragraph(segments: ParagraphSegment[]): Paragraph {
    const content = segments
        .map((s) => s.content)
        .join("")
        .trim();
    if (thematic_break_regex.test(content)) {
        if (content === "") {
            return { kind: "break" };
        } else {
            return { kind: "break", dinkus: content };
        }
    }
    return segments;
}

function segment_to_xhtml(segment: ParagraphSegment): string {
    let html = segment.content;
    if (segment.style.emphasis) {
        html = `<em>${html}</em>`;
    }
    if (segment.style.strong) {
        html = `<strong>${html}</strong>`;
    }
    if (segment.style.underline) {
        html = `<u>${html}</u>`;
    }
    if (segment.style.del) {
        html = `<del>${html}</del>`;
    }
    return html;
}

function to_xhtml(paragraph: Paragraph): string {
    if ("kind" in paragraph) {
        switch (paragraph.kind) {
            case "break": {
                if ("dinkus" in paragraph) {
                    return `<span class="dinkus-break" role="separator">${paragraph.dinkus}</span>`;
                } else {
                    return `<hr class="whitespace-break" />`;
                }
            }
        }
    } else {
        const segments = paragraph.map(segment_to_xhtml).join("");
        return `<p>${segments}</p>`;
    }
}

export async function get_chapters(
    chapter_refs: ChapterRef[],
): Promise<Chapter[]> {
    const raws = await fetch_chapter_raws(chapter_refs);
    const chapters = raws.map(({ title, order, html }) => {
        const identifier = "chapter" + order.toString().padStart(4, "0");
        const chapter = cheerio.load(html);
        const paragraphs = chapter(":is(#chp_raw, #chp_raw div) > p")
            .toArray()
            .map((el) => to_xhtml(to_paragraph(to_segments(el))));

        return { order, title, identifier, paragraphs };
    });

    return chapters;
}
