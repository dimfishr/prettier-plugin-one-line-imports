import { version } from "prettier";
import { printers } from "prettier/plugins/estree";
import { parsers } from "prettier/plugins/typescript";

//#region src/index.ts
try {
	if (parseInt(version.split(".")[0], 10) < 3) throw new Error(`prettier-plugin-one-line-imports requires Prettier version 3.0.0 or higher. You are using version ${version}. Please upgrade Prettier to use this plugin.`);
} catch (error) {
	throw new Error("prettier-plugin-one-line-imports failed to parse Prettier version. Please use Prettier 3.0.0 or higher to use this plugin.");
}
/**
* Recursively replaces Line elements with a single space in Doc arrays
* but preserves comments and their formatting
*/
function removeLinesFromDoc(doc) {
	if (typeof doc === "string") return doc;
	if (Array.isArray(doc)) return doc.map((item, i) => {
		if (typeof item === "object" && item !== null && "type" in item) {
			if (item.type === "line") return i > 0 && i !== doc.length - 2 ? " " : "";
		}
		return removeLinesFromDoc(item);
	});
	if (typeof doc === "object" && doc !== null && "type" in doc) {
		const docCommand = doc;
		if (docCommand.contents) return {
			...docCommand,
			contents: removeLinesFromDoc(docCommand.contents)
		};
		if (docCommand.type === "fill" && docCommand.parts) return {
			...docCommand,
			parts: removeLinesFromDoc(docCommand.parts)
		};
		if (docCommand.type === "if-break") return {
			...docCommand,
			breakContents: removeLinesFromDoc(docCommand.breakContents),
			flatContents: removeLinesFromDoc(docCommand.flatContents)
		};
		if (docCommand.type === "group" && docCommand.expandedStates) return {
			...docCommand,
			expandedStates: removeLinesFromDoc(docCommand.expandedStates)
		};
		return docCommand;
	}
	return doc;
}
/**
* Returns true if any import specifier has comments
*/
function hasCommentsInSpecifiers(node) {
	if (node.specifiers) {
		for (const specifier of node.specifiers) if (specifier.comments && specifier.comments.length > 0) return true;
	}
	return false;
}
const languages = [{
	name: "TypeScript",
	parsers: ["typescript"],
	extensions: [".ts"],
	vscodeLanguageIds: ["typescript"]
}, {
	name: "TypeScript JSX",
	parsers: ["typescript-jsx"],
	extensions: [".tsx"],
	vscodeLanguageIds: ["typescriptreact"]
}];
const plugin = {
	parsers: {
		typescript: { ...parsers.typescript },
		"typescript-jsx": { ...parsers.typescript }
	},
	languages,
	printers: { estree: {
		...printers.estree,
		print: (path, options, print, args) => {
			const node = path.getNode();
			let printed = printers.estree.print(path, options, print, args);
			if (node.type === "ImportDeclaration") {
				if (!hasCommentsInSpecifiers(node)) printed = removeLinesFromDoc(printed);
			}
			return printed;
		}
	} }
};
var src_default = plugin;

//#endregion
export { src_default as default };