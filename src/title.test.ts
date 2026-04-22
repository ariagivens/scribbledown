import { parse_title, lex_title } from "./title";
import { expect, test } from "vitest";

test("Single span title", () => {
    const title = parse_title(lex_title("I Became My Vampire Witch Character"));
    expect(title.title).toEqual("I Became My Vampire Witch Character");
    expect(title.subtitles).toEqual([]);
});

test("Subtitle ending with exclamation mark", () => {
    const title = parse_title(
        lex_title(
            "Naruto: Reincarnated As Azula, From The Same Generation As The Sannin!",
        ),
    );
    expect(title.title).toEqual("Naruto");
    expect(title.subtitles).toEqual([
        "Reincarnated As Azula, From The Same Generation As The Sannin!",
    ]);
});

test("Title with tag", () => {
    const title = parse_title(
        lex_title("Project Seraphina [LitRPG, Magitech, GL]"),
    );
    expect(title.title).toEqual("Project Seraphina");
    expect(title.subtitles).toEqual([]);
});

test("Subtitle separated with dash", () => {
    const title = parse_title(lex_title("Beyond Chaos – A DiceRPG"));
    expect(title.title).toEqual("Beyond Chaos");
    expect(title.subtitles).toEqual(["A DiceRPG"]);
});

test("Subtitle separated with colon", () => {
    const title = parse_title(lex_title("Great Journey: Whims of Fate"));
    expect(title.title).toEqual("Great Journey");
    expect(title.subtitles).toEqual(["Whims of Fate"]);
});

test("Title with close tag", () => {
    const title = parse_title(
        lex_title("My Only Familiar Is Me[A Late-Blooming Evolution Story]"),
    );
    expect(title.title).toEqual("My Only Familiar Is Me");
    expect(title.subtitles).toEqual([]);
});

test("Subtitle separated with exclamation mark", () => {
    const title = parse_title(
        lex_title("F*ck! What Do You Mean I Have To Tame Them To Survive!?"),
    );
    expect(title.title).toEqual("F*ck!");
    expect(title.subtitles).toEqual([
        "What Do You Mean I Have To Tame Them To Survive!?",
    ]);
});

test("Subtitle separated with far colon", () => {
    const title = parse_title(
        lex_title("Prestige Grinding : I Can Reset My Level"),
    );
    expect(title.title).toEqual("Prestige Grinding");
    expect(title.subtitles).toEqual(["I Can Reset My Level"]);
});

test("Subtitle in parens", () => {
    const title = parse_title(lex_title("The Rusting (Robots and Revenge)"));
    expect(title.title).toEqual("The Rusting");
    expect(title.subtitles).toEqual(["Robots and Revenge"]);
});

test("Title with dash, subtitle separated by colon, tag", () => {
    const title = parse_title(
        lex_title(
            "SSS-Primal Predator: Wolf Evolution [LitRPG/Isekai adventure/Dark fantasy]",
        ),
    );
    expect(title.title).toEqual("SSS-Primal Predator");
    expect(title.subtitles).toEqual(["Wolf Evolution"]);
});

test("Subtitle separated with dash, tag", () => {
    const title = parse_title(
        lex_title(
            "PUPPETMASTER – ARMY OF ONE [Far-Future Cultivation, Psychic Powers, No Cheats, Selfmade OPMC]",
        ),
    );
    expect(title.title).toEqual("PUPPETMASTER");
    expect(title.subtitles).toEqual(["ARMY OF ONE"]);
});

test("Multiple subtitles, tag", () => {
    const title = parse_title(
        lex_title(
            "The Power: The Beast of Mainstreet; Battle of London (Taylor's version) [LitRPG]",
        ),
    );
    expect(title.title).toEqual("The Power");
    expect(title.subtitles).toEqual([
        "The Beast of Mainstreet",
        "Battle of London",
        "Taylor's version",
    ]);
});
