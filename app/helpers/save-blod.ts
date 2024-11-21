import fs from "fs"
import crypto from "crypto"
import zlib from "zlib"
export const saveBlob = (path: string) => {
    const content = fs.readFileSync(path)
    const prefix = Buffer.from(`blob ${content.length}\0`)
    const dataBuffer = Buffer.concat([prefix, content])

    const hash = crypto.createHash("sha1").update(dataBuffer).digest("hex")
    const compData = zlib.deflateSync(dataBuffer)
    fs.mkdirSync(`.vcs/objects/${hash.slice(0, 2)}`, { recursive: true })
    fs.writeFileSync(`.vcs/objects/${hash.slice(0, 2)}/${hash.slice(2)}`, compData)
}
