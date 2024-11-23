import type { IndexType } from "../../types/index-type";
import zlib from "zlib"
import crypto from "crypto"
import fs from "fs"
import { setNestedProperty } from "../utils/generateNestedObj";
import { saveBlobWithContent } from "../helpers/save-blod";
import chalk from "chalk";
import { readObjects } from "../helpers/readObjects";
import { treeParser } from "../utils/commitTreeParser";
const indexPath = ".vcs/index.json"
let indexJson: IndexType[] = []

// Only read the index file if it exists
if (fs.existsSync(indexPath)) {
    const indexBuffer = fs.readFileSync(indexPath)
    indexJson = JSON.parse(indexBuffer.toString()) as IndexType[]
} else {
    // If the file doesn't exist, initialize an empty index array
    console.log(`No index file found at ${indexPath}, initializing a new index.`);
    indexJson = [] // or handle it as needed
}

interface CommitStatus {
    added: string[],
    modified: string[],
    deleted: string[]
}

const commitStatus: CommitStatus = {
    added: [],
    deleted: [],
    modified: []
}

export const commit = (message: string) => {
    let treeObj: { [key: string]: any } = {};

    // get old commit 
    const oldHash = fs.readFileSync(".vcs/refs/heads/main").toString()

    if (oldHash.trim() !== "") {
        const commiteBlob = readObjects(oldHash)

        const lastCommitTreeHash = commiteBlob.split("\n")[0].split(" ")[1]

        const indexJsonMap = new Map(
            indexJson.map((entry) => [entry.path.split("/").pop(), entry.hash])
        )
        const allFilesInCommit: { name: string, hash: string }[] = [];
        compareCommitAndStage(allFilesInCommit, lastCommitTreeHash, indexJsonMap)

        const allFilesCommitMap = new Map(
            allFilesInCommit.map((entry) => [entry.name, `${entry.hash}`])
        );

        indexJsonMap.forEach((hash, fileName) => {
            if (!allFilesCommitMap.has(fileName as any)) {
                commitStatus.added.push(fileName as any); // File exists in index but not in tree
            } else if (allFilesCommitMap.get(fileName as any) !== hash) {
                commitStatus.modified.push(fileName as any); // File exists but with different content
            }
        });

        if (
            commitStatus.added.length === 0 &&
            commitStatus.modified.length === 0 &&
            commitStatus.deleted.length === 0
        ) {
            return console.log(chalk.green("You are working on a clean sheet, nothing to commit"))
        }
    }


    // make structure of fir in a object formate
    indexJson.forEach(index => {
        const cleanedPath = index.path.slice(2)
        setNestedProperty(treeObj, cleanedPath.split("/"), index.hash)

    })

    const commitTreeHash = makeTreeBlob(treeObj)
    if (!commitTreeHash) {
        return console.error("Error trying to commit")
    }
    makeCommitObject(message, commitTreeHash)

    commitStatus.added.forEach(com => (
        console.log(chalk.green("create mode", com))
    ))
    commitStatus.modified.forEach(com => (
        console.log(chalk.yellow("modify mode", com))
    ))
    commitStatus.deleted.forEach(com => (
        console.log(chalk.red("delete mode", com))
    ))
}

const compareCommitAndStage = (allPastCommittedFiles: { name: string, hash: string }[], mainHash: string, indexMap: Map<any, any>) => {

    const commitTree = readObjects(mainHash)
    const parsedTreeData = treeParser(commitTree.trim())
    const commitTreeMap = new Map(
        parsedTreeData.map((entry) => [entry.fileName, `${entry.fileType} ${entry.hash}`])
    );
    commitTreeMap.forEach((typeAndHash, fileName) => {
        if (typeAndHash.split(" ")[0] === "tree") {
            compareCommitAndStage(allPastCommittedFiles, typeAndHash.split(" ")[1], indexMap)
        } else {
            if (!indexMap.has(fileName)) {
                commitStatus.deleted.push(fileName); // File exists in tree but not in index
            }

            allPastCommittedFiles.push({
                name: fileName,
                hash: typeAndHash.split(" ")[1]
            })
        }
    })
}

const makeCommitObject = (message: string, treeHash: string) => {
    const content = `tree ${treeHash}
author ${process.env.VCS_USER_EMAIL}
commiter ${process.env.VSC_USER_EMAIL}

${message}`
    const hash = saveBlobWithContent(content, "commit")
    console.log(chalk.blue("Commit Blob Hash:", hash))

    fs.writeFileSync(".vcs/refs/heads/main", hash)
}




const makeTreeBlob = (treeObj: { [key: string]: any }) => {
    let content;
    for (let key in treeObj) {
        if (typeof treeObj[key] === "object") {
            const treeHex = makeTreeBlob(treeObj[key])
            content = `${content ? content : ""}
2000 tree ${key} ${treeHex}`
        } else {
            content = `${content ? content : ""}
1000 blob ${key} ${treeObj[key]}`
        }
    }
    if (!content) {
        console.error("empty content")
        return null
    }

    const prefix = Buffer.from(`tree ${content.length}\0`)
    const contentBinary = Buffer.from(content)
    const dataBuffer = Buffer.concat([prefix, contentBinary])

    const hash = crypto.createHash("sha1").update(dataBuffer).digest("hex")
    const compData = zlib.deflateSync(dataBuffer)

    fs.mkdirSync(`.vcs/objects/${hash.slice(0, 2)}`, { recursive: true })
    fs.writeFileSync(`.vcs/objects/${hash.slice(0, 2)}/${hash.slice(2)}`, compData)
    return hash
}
