import * as fs from 'fs';
import crypto from "crypto"
import zlib from "zlib"
import { add } from './helpers/write-tree';
import { getStatus } from './commands/status';
import { commit } from './commands/commit';

const args = process.argv.slice(2);
const command = args[0];

enum Commands {
    Init = "init",
    CatFile = "cat-file",
    HashFile = "hash-file",
    WriteTree = "write-tree",
    Add = "add",
    Status = "status",
    Commit = "commit"
}

switch (command) {
    case Commands.Init:
        // You can use print statements as follows for debugging, they'll be visible when running tests.
        //console.error("Logs from your program will appear here!");

        // Uncomment this block to pass the first stage
        fs.mkdirSync(".vcs", { recursive: true });
        fs.mkdirSync(".vcs/objects", { recursive: true });
        fs.mkdirSync(".vcs/refs", { recursive: true });
        fs.writeFileSync(".vcs/HEAD", "ref: refs/heads/main\n");
        fs.writeFileSync(".vcs/index.json", "[]")
        console.log("Initialized.vcs directory");
        break;
    case Commands.CatFile:
        if (args[1] === "-p") {
            try {

                const hash = args[2]
                const blob = fs.readFileSync(`.vcs/objects/${hash.slice(0, 2)}/${hash.slice(2)}`)
                const unzippedBlob = zlib.unzipSync(blob)
                const data = unzippedBlob.toString().split("\0")[1]
                process.stdout.write(data)
            } catch (e) {

                console.error("No blob found", e)
            }
        }
        break
    case Commands.HashFile:
        const filePath = args[2]
        const content = fs.readFileSync(filePath)
        const prefix = Buffer.from(`blob ${content.length}\0`)
        const dataBuffer = Buffer.concat([prefix, content])

        const hash = crypto.createHash("sha1").update(dataBuffer).digest("hex")
        process.stdout.write(hash)

        if (args[1] === "-w") {
            const compData = zlib.deflateSync(dataBuffer)
            fs.mkdirSync(`.vcs/objects/${hash.slice(0, 2)}`, { recursive: true })
            fs.writeFileSync(`.vcs/objects/${hash.slice(0, 2)}/${hash.slice(2)}`, compData)
        }
        break
    case Commands.Add:
        add({ path: "." })
        break
    case Commands.Status:
        getStatus(".")
        break
    case Commands.Commit:
        commit()
        break
    default:
        throw new Error(`Unknown command ${command}`);
}
