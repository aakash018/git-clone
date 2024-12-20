import fs from "node:fs"
import type { IndexType } from "../../types/index-type"
import { getHash } from "./getHash"
import { hash } from "bun"
import { saveBlob } from "./save-blod"
import chalk from "chalk"
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


const allDirs: string[] = []
export const add = ({
    path
}: {
    path: string
}) => {
    fs.readdirSync(path).forEach((dir) => {
        if (
            dir === ".vcs" ||
            dir === ".git" ||
            dir === "node_modules"
        ) return
        const dirLoc = `${path}/${dir}`
        allDirs.push(dirLoc)
        const file = fs.statSync(dirLoc)
        if (file.isDirectory()) {
            add({ path: dirLoc })
        } else if (file.isFile()) {
            const fileHash = getHash(dirLoc)

            // If the file is already staged 
            if (indexJson.find(ind => ind.hash === fileHash)) {
                //same content in different files
                if (indexJson.find(ind => ind.path !== dirLoc)) {
                    indexJson.push({
                        path: dirLoc,
                        hash: fileHash,
                        cti: file.ctime,
                        mti: file.mtime,
                        size: file.size
                    })
                } else {
                    console.log("unmodified", dirLoc)
                }

                // If the file was modufied
            } else if (indexJson.find(ind => ind.path === dirLoc)) {
                console.log("modified", dirLoc)
                const nepJson = indexJson.map(ind => {
                    if (ind.path === dirLoc) {
                        return {
                            ...ind,
                            size: file.size,
                            hash: fileHash,
                            mti: file.mtime,
                        }
                    } else {
                        return ind
                    }
                })
                indexJson = nepJson
                saveBlob(dirLoc, "blob")
                // if it is a new file
            } else if (!indexJson.some(index => index.path === dirLoc)) {
                console.log("added", dirLoc)
                indexJson.push({
                    hash: fileHash,
                    path: dirLoc,
                    cti: file.ctime,
                    size: file.size,
                    mti: file.mtime
                })
                saveBlob(dirLoc, "blob")
            }

        } else if (file.isSymbolicLink()) {
            console.log("This file is not supported")
        }
    })

    return [indexJson, allDirs]
}
