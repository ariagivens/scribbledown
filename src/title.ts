export type Title = {
    title: string;
    subtitles: string[];
};

type TitleSeparatorKind =
    | "strong_separator"
    | "weak_separator"
    | "mark_separator"
    | "open_paren"
    | "close_paren"
    | "open_bracket"
    | "close_bracket";

type TitleSeparator = {
    kind: TitleSeparatorKind;
    content: string;
};

type SearchResult = {
    span: string;
    separator?: TitleSeparator;
    rest?: string;
};

const strong_separators = [":", ";", "—", "--"]; // Colon, semicolon, or em-dash (possibly surrounded with whitespace)
const weak_separators = ["-", "–"]; // Dash or en-dash that *must* be surrounded with whitespace
const mark_separators = ["?", "!"]; // Quotation mark or exclamation point (possibly surrounded with whitespace)
const open_paren = ["(", "{"]; // Open paren or brace (possibly surrounded with whitespace)
const close_paren = [")", "}"]; // Close paren or brace (possibly surrounded with whitespace)
const open_bracket = ["["]; // Open bracket (possibly surrounded with whitespace)
const close_bracket = ["]"]; // Close bracket (possibly surrounded with whitespace)
function separator_kind(separator: string): TitleSeparatorKind {
    if (strong_separators.some((sep) => separator.includes(sep))) {
        return "strong_separator";
    } else if (weak_separators.some((sep) => separator.includes(sep))) {
        return "weak_separator";
    } else if (mark_separators.some((sep) => separator.includes(sep))) {
        return "mark_separator";
    } else if (open_paren.some((sep) => separator.includes(sep))) {
        return "open_paren";
    } else if (close_paren.some((sep) => separator.includes(sep))) {
        return "close_paren";
    } else if (open_bracket.some((sep) => separator.includes(sep))) {
        return "open_bracket";
    } else if (close_bracket.some((sep) => separator.includes(sep))) {
        return "close_bracket";
    } else {
        throw new Error(`Unexpected separator: ${separator}`);
    }
}

const seperator_regex =
    /(\s+[-–]\s+|\s*[\:\;\—\(\)\{\}\[\]]\s*|\s*--\s*|\s*[\?\!]+\s*)/;
function search_separator(text: string): SearchResult {
    const match = seperator_regex.exec(text);
    if (!match) {
        // The search string contains no more separators
        return {
            span: text,
        };
    }

    const span = text.substring(0, match.index);
    const content = match[0];
    const separator = { kind: separator_kind(content), content };
    const rest = text.substring(match.index + match[0].length);
    if (rest === "") {
        return { span, separator };
    } else {
        return { span, separator, rest };
    }
}

type Token = TitleSeparator | string;

export function lex_title(dirty_title: string): Token[] {
    const tokens = [];
    let rest: string | undefined = dirty_title.trim();
    while (rest) {
        const result = search_separator(rest);
        if (result.span !== "") {
            tokens.push(result.span);
        }
        if (result.separator) {
            tokens.push(result.separator);
        }
        rest = result.rest;
    }

    return tokens;
}

type SeparatorSequence = {
    sequence: TitleSeparator[];
    next: string | undefined;
    rest: Token[];
};

function get_separator_sequence(next: Token, rest: Token[]): SeparatorSequence {
    let candidate: Token | undefined = next;
    const sequence = [];
    let index = 0;
    while (candidate && typeof candidate !== "string") {
        sequence.push(candidate);
        candidate = rest[index];
        index += 1;
    }
    return { sequence, next: candidate, rest: rest.slice(index) };
}

type SpanSequence = {
    sequence: string[];
    next: TitleSeparator | undefined;
    rest: Token[];
};

function get_span_sequence(next: Token, rest: Token[]): SpanSequence {
    let candidate: Token | undefined = next;
    const sequence = [];
    let index = 0;
    while (candidate && typeof candidate === "string") {
        sequence.push(candidate);
        candidate = rest[index];
        index += 1;
    }
    return {
        sequence,
        // The while loop ensures that candidate is NOT a string,
        // therefore it must be a TitleSeparator | undefined
        next: <TitleSeparator | undefined>candidate,
        rest: rest.slice(index),
    };
}

type FirstTitle = {
    title: string;
    next: TitleSeparator | undefined;
    rest: Token[];
};
function get_first_title(tokens: Token[]): FirstTitle {
    if (!tokens[0]) {
        return { title: "Untitled", next: undefined, rest: tokens };
    }

    const {
        sequence: sep_sequence,
        next: sep_next,
        rest: sep_rest,
    } = get_separator_sequence(tokens[0], tokens.slice(1));
    let title = sep_sequence.map((s) => s.content).join("");

    if (sep_next) {
        const {
            sequence: span_sequence,
            next: span_next,
            rest: span_rest,
        } = get_span_sequence(sep_next, sep_rest);
        title += span_sequence.join("");

        return {
            title,
            next: span_next,
            rest: span_rest,
        };
    } else {
        return { title, next: undefined, rest: sep_rest };
    }
}

class TitleBuilder {
    title: string;
    subtitles: string[] = [];

    constructor(title: string) {
        this.title = title;
    }

    push(subtitle: string) {
        this.subtitles.push(subtitle);
    }

    append_to_last(text: string) {
        if (this.subtitles[this.subtitles.length - 1]) {
            this.subtitles[this.subtitles.length - 1] += text;
        } else {
            this.title += text;
        }
    }

    build(): Title {
        return { title: this.title, subtitles: this.subtitles };
    }
}

type GroupOpener = {
    group_start: number;
    closer: string;
};
function group_opener(
    group_start: number,
    opener: string,
): GroupOpener | undefined {
    switch (opener.trim()) {
        case "(":
            return { group_start, closer: ")" };
        case "{":
            return { group_start, closer: "}" };
        case "[":
            return { group_start, closer: "]" };
        default:
            return undefined;
    }
}

function check_group_opener(
    candidate: TitleSeparator,
    other_separators: TitleSeparator[],
): GroupOpener | undefined {
    const nearest_group = other_separators.findIndex(
        (e) => e.kind === "open_paren" || e.kind === "open_bracket",
    );
    if (candidate.kind === "open_paren" || candidate.kind === "open_bracket") {
        return group_opener(0, candidate.content);
    } else if (nearest_group > -1) {
        // `findIndex` guarantees that the item will actually exist
        return group_opener(
            nearest_group + 1,
            <string>other_separators[nearest_group]?.content,
        );
    } else {
        return undefined;
    }
}

type Group = {
    title: string;
    next: TitleSeparator | undefined;
    rest: Token[];
};
function parse_group(closer: string, tokens: Token[]): Group | undefined {
    const close_index = tokens.findIndex(
        (s) => typeof s !== "string" && s.content.trim() === closer,
    );
    if (close_index > -1) {
        const title = tokens
            .slice(0, close_index)
            .map((s) => (typeof s === "string" ? s : s.content))
            .join("");
        const rest = tokens.slice(close_index + 1);
        return { title, next: { kind: "strong_separator", content: "" }, rest };
    } else {
        return undefined;
    }
}

export function parse_title(tokens: Token[]): Title {
    const first_title = get_first_title(tokens);
    const title_builder = new TitleBuilder(first_title.title);
    let candidate: TitleSeparator | undefined = first_title.next;
    tokens = first_title.rest;

    while (candidate) {
        const sep_sequence = get_separator_sequence(candidate, tokens);

        // No more spans => append the last separators to the last title
        if (!sep_sequence.next) {
            title_builder.append_to_last(
                sep_sequence.sequence.map((e) => e.content).join(""),
            );
            break;
        }

        // ? ! => append to last title, then treat as empty strong separator
        if (candidate.kind === "mark_separator") {
            title_builder.append_to_last(candidate.content.trim());
            candidate = { kind: "strong_separator", content: "" };
            continue;
        }

        const group_opener = check_group_opener(
            candidate,
            sep_sequence.sequence,
        );
        if (group_opener) {
            // TitleSeparator[] -> Token[] is an upcast and therefore type-safe
            const ts = (sep_sequence.sequence as Token[])
                .concat([sep_sequence.next])
                .slice(group_opener.group_start + 1)
                .concat(sep_sequence.rest);
            const group = parse_group(group_opener.closer, ts);
            if (group) {
                if (group_opener.closer !== "]") {
                    title_builder.push(group.title);
                }
                tokens = group.rest;
                candidate = group.next;
                continue;
            } else {
                if (sep_sequence.sequence[0]) {
                    candidate = sep_sequence.sequence[0];
                    tokens = ts.slice(1);
                    continue;
                } else {
                    candidate = { kind: "strong_separator", content: "" };
                }
            }
        }

        if (
            candidate.kind === "strong_separator" ||
            candidate.kind === "weak_separator"
        ) {
            const span_sequence = get_span_sequence(
                sep_sequence.next,
                sep_sequence.rest,
            );

            title_builder.push(span_sequence.sequence.join(""));
            candidate = span_sequence.next;
            tokens = span_sequence.rest;
            continue;
        }

        if (
            candidate.kind === "close_paren" ||
            candidate.kind === "close_bracket"
        ) {
            tokens = tokens.slice(1);
        }
    }

    return title_builder.build();
}

export function get_title(): Title {
    const dirty_title =
        document.querySelector<HTMLMetaElement>("meta[property='og:title']")
            ?.content ?? "Untitled";
    const tokens = lex_title(dirty_title);
    return parse_title(tokens);
}

export function fulltitle(title: Title): string {
    let t = title.title;
    if (title.subtitles[0]) {
        t += `: ${title.subtitles[0]}`;
    }
    for (const subtitle of title.subtitles.slice(1)) {
        t += `; ${subtitle}`;
    }
    return t;
}
