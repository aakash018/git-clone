export const treeParser = (treeString: string) => {
    const listOfBlobs = treeString.split("\n")

    const parsedData = listOfBlobs.map(blob => {
        const splitedData = blob.split(" ")
        return ({
            filePermission: splitedData[0],
            fileType: splitedData[1],
            fileName: splitedData[2],
            hash: splitedData[3]
        })
    })
    return parsedData;
}
