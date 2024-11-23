import fs from "fs"
import zlib from "zlib"
export const readObjects = (hash: string) => {
    const blob = fs.readFileSync(`.vcs/objects/${hash.slice(0, 2)}/${hash.slice(2)}`)
    const unzippedBlob = zlib.unzipSync(blob)
    const data = unzippedBlob.toString().split("\0")[1]

    return data;
}
