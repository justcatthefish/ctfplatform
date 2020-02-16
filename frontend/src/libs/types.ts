import { types } from "mobx-state-tree";

export const DateFromString = types.custom<string, Date>({
    name: "Date",
    fromSnapshot(value: string) {
        return new Date(value);
    },
    toSnapshot(value: Date) {
        return value.toString();
    },
    isTargetType(value: string | Date): boolean {
        return value instanceof Date;
    },
    getValidationMessage(value: string): string {
        if (!isNaN((new Date(value)).getDate())) {
            return "";
        }
        return `'${value}' doesn't look like a valid date`;
    },
});
