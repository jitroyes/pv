#!/usr/bin/env -S deno run --allow-write=public --allow-read=.

import { walk } from "https://jsr.io/@std/fs/1.0.19/walk.ts";
import { CHILDREN, html, minify } from "./html.ts";

const STYLE = html("style", await minify("style.css"));
const SEARCH = html("script type=module", await minify("search.js"));
const FOOTER = html(
	"footer",
	"Par les jeunes insoumis·es de Troyes",
	html("br"),
	html(
		"a href=https://actionpopulaire.fr/groupes/e5b88d81-1ec3-4c50-a2ff-7f180373177f/ ",
		"[action populaire]",
	),
	" ",
	html("a href=mailto:jeunesinsoumistroyes@gmail.com", "[mail]"),
	" ",
	html("a href=https://github.com/jitroyes/pv", "[github]"),
);

const dirs = [
	"data-troyes",
];

await Deno.mkdir("public", { recursive: true });
await writeIndex();
await Promise.all(dirs.map(dataDir));

async function writeIndex() {
	await Deno.writeTextFile(
		"public/index.html",
		"<!DOCTYPE html>" + html(
			"html lang=fr",
			html("head", html("title", "Tous les dossiers"), STYLE),
			html(
				"body",
				html("header", "Tous les dossiers"),
				html(
					"main",
					html(
						"ul.toc",
						dirs.map((d) =>
							html(
								"li",
								html(
									`a href=${d}.html`,
									d.replace("data-", ""),
								),
							)
						),
					),
				),
				FOOTER,
			),
		).h,
	);
}

async function dataDir(dir: string) {
	const files = (await Array.fromAsync(walk(dir, {
		includeDirs: false,
		exts: [".txt"],
	}))).map((entry) => entry.path);
	console.log(files.join("\n") + "\n");

	const title = dir.replace("data-", "PV de: ");
	await Deno.writeTextFile(
		`public/${dir}.html`,
		"<!DOCTYPE html>" + html(
			"html lang=fr",
			html("head", html("title", title), STYLE),
			html(
				"body",
				html("header", title),
				html(
					"main",
					html("a href=.", "Tous les dossiers"),
					html(
						"ul.toc",
						"Sommaire",
						files.map((f) => html("li", html("a href=#" + f, f))),
					),
					html(
						"input id=s type=search hidden placeholder='Recherche simple'",
					),
					await Promise.all(files.map((f) => file(f))),
				),
				FOOTER,
				SEARCH,
			),
		).h,
	);
}

async function file(path: string): Promise<CHILDREN[]> {
	const lines = (await Deno.readTextFile(path)).split(/\r?\n/);

	const groups: string[][] = [[]];
	for (const line of lines) {
		if (line) {
			groups[groups.length - 1].push(line);
		} else {
			groups.push([]);
		}
	}

	return [
		html(
			"h1 id=" + path,
			path.replaceAll(/[^/]*\//g, "").replace(/\.txt$/, ""),
		),
		...groups.filter((x) => x.length).map(([head, title, ...subtitle]) => {
			const [page, folder, ...tags] = head.split(" ");
			return html(
				"div.item id=" + path + "/" + folder,
				html(
					"div.meta",
					html(
						"a.id href=#" + path + "/" + folder,
						"#",
					),
					` [dossier=${folder} | page=${page}] `,
					tags.map((tag) => html("span.tag", "#", tag, " ")),
				),
				html("div.title", title),
				subtitle.map((sub) => html("div.sub", sub)),
			);
		}),
	];
}
