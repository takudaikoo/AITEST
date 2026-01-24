import { format, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { ja } from 'date-fns/locale';

export const TIMEZONE_JST = 'Asia/Tokyo';

/**
 * Parses a date considering it as JST
 * Useful when user input needs to be treated as JST and converted to UTC Date object
 */
export const parseAsJST = (dateString: string): Date => {
    return fromZonedTime(dateString, TIMEZONE_JST);
};

/**
 * Formats a Date object into a JST string
 * @param date Native Date object (UTC)
 * @param formatStr Format string (default: 'yyyy-MM-dd HH:mm')
 */
export const formatJST = (date: Date | string | null | undefined, formatStr = 'yyyy-MM-dd HH:mm'): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(toZonedTime(d, TIMEZONE_JST), formatStr, { locale: ja });
};

/**
 * Returns current timestamp in ISO format but potentially useful debug helper
 * In Supabase/DB, we stick to ISO UTC strings.
 * This helper is mainly if we need a "JST-like" string representation for some reason.
 */
export const getNowJST = (): Date => {
    return toZonedTime(new Date(), TIMEZONE_JST);
};
