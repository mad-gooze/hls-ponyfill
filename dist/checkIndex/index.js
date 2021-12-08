/**
 * Throws an error if index is out of bounds
 */
export function checkIndex(index, length) {
    if (index < 0 || index >= length) {
        throw Error('Index is out of bounds.');
    }
}
