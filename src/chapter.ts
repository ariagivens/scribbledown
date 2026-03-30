import type { ChapterRef } from "./chapter_ref";
import { lazy } from "@nfnitloop/better-iterators";
import * as cheerio from "cheerio";

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

export async function get_chapters(
    chapter_refs: ChapterRef[],
): Promise<Chapter[]> {
    const raws = await fetch_chapter_raws(chapter_refs);
    const chapters = raws.map(({ title, order, html }) => {
        const identifier = "chapter" + order.toString().padStart(4, "0");
        const chapter = cheerio.load(html);
        const paragraphs = chapter(
            ":is(#chp_raw, #chp_raw > div, #chp_raw > div > div) > :is(p, b, i, u)",
        )
            .map((i, p) => chapter(p).text().trim())
            .filter((i, p) => p !== "")
            .toArray();
        return { order, title, identifier, paragraphs };
    });

    return chapters;
}
