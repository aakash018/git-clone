import * as fs from 'fs';
import crypto from "crypto"
export const getHash = (path: string) => {

    const content = fs.readFileSync(path)
    const prefix = Buffer.from(`blob ${content.length}\0`)
    const dataBuffer = Buffer.concat([prefix, content])

    const hash = crypto.createHash("sha1").update(dataBuffer).digest("hex")

    return hash
}
