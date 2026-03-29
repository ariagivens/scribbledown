import * as cheerio from "cheerio";

export type ChapterRef = {
    order: number;
    title: string;
    link: string;
};

function get_num_pages(): number {
    const page_buttons = document.getElementById(
        "pagination-mesh-toc",
    )?.children;
    const num_pages = page_buttons?.item(page_buttons.length - 2)?.firstChild
        ?.textContent;
    if (num_pages) {
        // TODO: REVERT
        // return parseInt(num_pages);
        return 1;
    } else {
        throw new Error("Failed to detect number of pages");
    }
}

const post_id_regex = /postid-(?<post_id>\d+)/;
function get_post_id(): string {
    const classes = document.getElementsByTagName("body").item(0)?.className;
    if (!classes) {
        throw new Error("Failed to identify post id");
    }
    const post_id = post_id_regex.exec(classes)?.groups?.post_id;
    if (!post_id) {
        throw new Error("Failed to identify post id");
    }
    return post_id;
}

async function get_toc_html(page: number, post_id: string): Promise<string> {
    const response = await fetch(
        "https://www.scribblehub.com/wp-admin/admin-ajax.php",
        {
            method: "POST",
            body: new URLSearchParams({
                action: "wi_getreleases_pagination",
                pagenum: page.toString(),
                mypostid: post_id,
            }),
        },
    );

    if (!response.ok) {
        throw new Error("Failure");
    }

    return await response.text();
}

export async function get_chapter_refs(): Promise<ChapterRef[]> {
    const num_pages = get_num_pages();
    const post_id = get_post_id();
    const refs: ChapterRef[] = [];
    for (let i = 1; i <= num_pages; i++) {
        const html = await get_toc_html(i, post_id);
        const toc_page = cheerio.load(html);
        const listItems = Array.from(toc_page("li"));
        listItems.forEach((li) => {
            const order = li.attribs["order"];
            const a = toc_page("a", li);
            const title = a.text();
            const link = a.attr("href");
            if (order && link) {
                refs.push({ order: parseInt(order), title, link });
            }
        });
    }
    return refs.toSorted((a, b) => a.order - b.order);
}
