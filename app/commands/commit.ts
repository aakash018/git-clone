import type { IndexType } from "../../types/index-type";
import fs from "fs"
import { setNestedProperty } from "../utils/generateNestedObj";
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
export const commit = () => {
    let treeObj: { [key: string]: any } = {};
    indexJson.forEach(index => {
        const cleanedPath = index.path.slice(2)
        console.log(cleanedPath)
        setNestedProperty(treeObj, cleanedPath.split("/"), index.hash)
    })

    console.log(treeObj)
}
