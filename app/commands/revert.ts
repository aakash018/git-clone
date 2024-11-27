import { parseCommitTree } from "../helpers/parse-commit-tree"
import { readObjects } from "../helpers/readObjects"

export const revertCommit = (commitHash: string) => {
    const commitObject = readObjects(commitHash)

    const parsedCommit = parseCommitTree(commitObject)

    const commitTree = readObjects(parsedCommit.tree)

    console.log(commitTree.trim())

}
