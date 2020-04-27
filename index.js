const { docopt } = require("docopt");
const Git = require("simple-git/promise");
const path = require("path");
const fs = require("mz/fs");

/** @type { Git.SimpleGit} */
const git = new Git(process.cwd());

async function resetTags() {
    try {
        console.log(await git.fetch("origin", "+refs/tags/*:refs/tags/*", "--prune"));
        console.log(await git.fetch("origin", null, "--tags"));
    } catch (err) {
        console.error(err);
    }
}

resetTags();