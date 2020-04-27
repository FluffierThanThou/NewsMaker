#!/usr/bin/env node
`use strict`;


const { docopt } = require("docopt");
const Git = require("simple-git/promise");
const path = require("path");
const fs = require("mz/fs");
const xml2js = require("xml2js");
const xmlBuilder = new xml2js.Builder();

/** @type { Git.SimpleGit} */
const git = new Git(process.cwd());

function createNewsItem(mod, body) {
    return {
        "Defs":
        {
            "HugsLib.UpdateFeatureDef":
            {
                "modNameReadable": mod.name,
                "modIdentifier": mod.packageId,
                "defName": `${mod.name}_${getVersionString(mod.version)}`.replace(/\W/g, "_"),
                "assemblyVersion": getVersionString(mod.version),
                "content": body
            }
        }
    }
}

async function resetTags() {
    try {
        await git.raw(["fetch", "--prune", "origin", "+refs/tags/*:refs/tags/*"]);
        await git.raw(["fetch", "--tags", "origin"]);
    } catch (err) {
        console.error(err);
    }
}

async function latestTag() {
    try {
        const tags = await git.tags()
        return tags.latest;
    } catch (err) {
        console.error(err)
    }
}

async function getChangeNotes() {
    try {
        const notes = await git.log({ from: await latestTag(), to: "HEAD" })
        return notes.all;
    } catch (err) {
        console.error(err)
    }
}

function getVersionString(version) {
    return `${version.major}.${version.minor}.${version.build}`;
}

function imageName(mod, note, ext = false) {
    return (getVersionString(mod.version) + note.message.substr(0, 10)).replace(/\W/g, "_") + (ext ? ext : "");
}

async function createNewsXml(mod, notes) {
    try {
        let body = notes.map(note => `|img:${imageName(mod, note)}|caption:${note.message}${note.body ? "\n|" + note.body : ""}`)
            .join("|");
        let news = createNewsItem(mod, body);
        return xmlBuilder.buildObject(news);
    } catch (err) {
        console.error(err)
    }
}

async function createNewsDef() {
    try {
        let mod = JSON.parse(await fs.readFile("Source/ModConfig.json", "utf8"));
        let notes = await getChangeNotes()
        let news = await createNewsXml(mod, notes);
        if (!(await fs.exists("News"))) {
            await fs.mkdir("News");
        }
        await Promise.all(notes.map(n => fs.writeFile(path.join("News", imageName(mod, n)), `placeholder for "${n.message}"`, "utf8")));
        await fs.writeFile(path.join("News", getVersionString(mod.version).replace(/\W/g, "_") + ".xml"), news, "utf8");
    } catch (err) {
        console.error(err)
    }
}

createNewsDef();