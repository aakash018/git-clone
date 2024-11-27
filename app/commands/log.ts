import chalk from "chalk"
import { readObjects } from "../helpers/readObjects"
import { parseCommitTree } from "../helpers/parse-commit-tree"

export const showLogs = (mainCommitHash: string) => {
    if (!mainCommitHash || mainCommitHash.trim() === "") return

    const lastCommit = readObjects(mainCommitHash)

    console.log(chalk.yellow(`commit hash ${mainCommitHash}`))

    const logToShow = parseCommitTree(lastCommit)
    console.log(`Date: ${logToShow.createdAt}  
Author: ${logToShow.author}

${logToShow.commitMessage}
      
    `)

    const parentCommitTreeHash = lastCommit.split("\n")[1].split(" ")[1]

    showLogs(parentCommitTreeHash)

}


