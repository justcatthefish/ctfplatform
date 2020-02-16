

export function formatDate(val: Date): string {
    return val.toLocaleString('en-GB', { timeZone: 'UTC' }) + " UTC"
}
