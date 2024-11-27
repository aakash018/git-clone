export const parseCommitTree = (commitObj: string) => {
    const lines = commitObj.split("\n")

    const data = {
        tree: lines[0].split(" ")[1],
        parrent: lines[1].split(" ")[1],
        commitMessage: lines[6],
        author: lines[2].slice(7),
        createdAt: lines[4].slice(6)
    }

    return data

}
