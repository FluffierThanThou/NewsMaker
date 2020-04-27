const { docopt } = require("docopt");
const Git = require("simple-git/promise");
const path = require("path");
const fs = require("mz/fs");

/** @type { Git.SimpleGit} */
const git = new Git(process.cwd());

async function resetTags() {
    try {
        await git.fetch("origin", ["--prune", "+refs/tags/*:refs/tags"]);
        await git.fetch("origin", ["--tags"]);
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
        console.log({ notes })
    } catch (err) {
        console.error(err)
    }
}

console.log(latestTag());
getChangeNotes()