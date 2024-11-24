import fs from "fs"
import chalk from "chalk"
import type { IndexType } from "../../types/index-type"
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
            if (new Date(reqFileInfoFromIndex!.mti).getTime() === new Date(file.mtime).getTime()) {
                return
            }
        }
    })
    const changeStatus = {
        added: [],
        modified: []
    }
}
