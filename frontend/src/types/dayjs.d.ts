import dayjs from 'dayjs';

declare module 'dayjs' {
    interface Dayjs {
        format(template?: string): string;
        toDate(): Date;
        toISOString(): string;
        valueOf(): number;
        isValid(): boolean;
        isBefore(date: Dayjs | string | number | Date): boolean;
        isAfter(date: Dayjs | string | number | Date): boolean;
        isSame(date: Dayjs | string | number | Date): boolean;
        add(value: number, unit: string): Dayjs;
        subtract(value: number, unit: string): Dayjs;
        isToday(): boolean;
        isBetween(
            from: string | number | Date | Dayjs,
            to: string | number | Date | Dayjs,
            unit?: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond',
            inclusive?: boolean | '[)' | '(]' | '()' | '[]'
        ): boolean;
        day(): number;
        day(value: number): Dayjs;
        clone(): Dayjs;
        add(value: number, unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond'): Dayjs;
        isAfter(date: string | number | Date | Dayjs): boolean;
        isBefore(date: string | number | Date | Dayjs): boolean;
    }

    const dayjs: {
        (date?: string | number | Date | Dayjs): Dayjs;
        (date?: string | number | Date | Dayjs, format?: string): Dayjs;
        extend(plugin: any): void;
        locale(locale: string): void;
        isDayjs(value: any): boolean;
    };

    export = dayjs;
} 