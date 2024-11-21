export function setNestedProperty(obj: any, keys: string[], value: string) {
    let current = obj;
    console.log(keys)
    keys.forEach((key, index) => {
        // If it's the last key, set the value
        if (index === keys.length - 1) {
            current[key] = value;
        } else {
            // Ensure the next level exists
            if (!current[key]) {
                current[key] = {};
            }
            current = current[key]; // Move to the next level
        }
    });
    return obj
}
