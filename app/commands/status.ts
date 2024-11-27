import fs from "fs"
import chalk from "chalk"
import type { IndexType } from "../../types/index-type"
import { readObjects } from "../helpers/readObjects"
import { compareCommitAndStage, type CommitStatus } from "./commit"
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
export const getStatus = (path: string) => {
    fs.readdirSync(path).forEach(dir => {
        if (
            dir === ".vcs" ||
            dir === ".git" ||
            dir === "node_modules"
        ) return
        const dirLoc = `${path}/${dir}`
        const file = fs.statSync(dirLoc)
        if (file.isDirectory()) {
            getStatus(dirLoc)
        } else if (file.isSymbolicLink()) {
            console.error(`${dirLoc} is not supported`)
        } else if (file.isFile()) {
            const reqFileInfoFromIndex = indexJson.find(file => file.path === dirLoc)
            if (!reqFileInfoFromIndex) {
                return console.log(chalk.red(`untracked ${dirLoc}`))
            }
        }
    })
}

export const diffFromLastCommit = () => {
    const commitStatus: CommitStatus = {
        added: [],
        modified: [],
        deleted: []
    }
    const oldHash = fs.readFileSync(".vcs/refs/heads/main").toString()

    if (oldHash.trim() !== "") {
        const commiteBlob = readObjects(oldHash)

        const lastCommitTreeHash = commiteBlob.split("\n")[0].split(" ")[1]

        const indexJsonMap = new Map(
            indexJson.map((entry) => [entry.path.split("/").pop(), entry.hash])
        )
        const allFilesInCommit: { name: string, hash: string }[] = [];
        compareCommitAndStage(commitStatus, allFilesInCommit, lastCommitTreeHash, indexJsonMap)

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
    }


    if (
        commitStatus.added.length === 0 &&
        commitStatus.modified.length === 0 &&
        commitStatus.deleted.length === 0
    ) {
        return console.log(chalk.green("No changes from the past commit"))
    }

    commitStatus.added.forEach(com => (
        console.log(chalk.green("create mode: ", com))
    ))
    commitStatus.modified.forEach(com => (
        console.log(chalk.yellow("modify mode: ", com))
    ))
    commitStatus.deleted.forEach(com => (
        console.log(chalk.red("delete mode: ", com))
    ))


}
