const DICTIONARY = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789';
const DICTIONARY_LENGTH = BigInt(DICTIONARY.length);

export const SHARECODE_PATTERN = /CSGO(-?[\w]{5}){5}$/;

function bytesToHex(bytes: number[]): string {
    return Array.from(bytes, (byte) => (`0${(byte & 0xff).toString(16)}`).slice(-2)).join('');
}

function stringToByteArray(str: string): number[] {
    const bytes = [];

    for (let i = 0; i < str.length; i += 2) {
        bytes.push(parseInt(str.slice(i, i + 2), 16));
    }

    return bytes;
}

function dec2bin(dec: number): string {
    const bin = (dec >>> 0).toString(2);
    return bin.padStart(3, '0');
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export const checkCode = (code: string): boolean => code && !!code.match(SHARECODE_PATTERN);

export const decode = (code: string): Crosshair => {
    if (code === undefined || !code.match(SHARECODE_PATTERN)) {
        return null;
    }

    try {
        const shareCode = code.replace(/CSGO|-/g, '');
        const chars = Array.from(shareCode).reverse();
        let big = BigInt(0);
        chars.forEach((_, i) => {
            big = (big * DICTIONARY_LENGTH) + BigInt(DICTIONARY.indexOf(chars[i]));
        });

        const str = big.toString().padStart(36, '0');
        const bytes = stringToByteArray(str);

        const crosshair: Crosshair = {
            alpha: 0,
            b: 0,
            color: 0,
            dot: false,
            g: 0,
            gap: 0,
            outline: false,
            outlineThickness: 0,
            r: 0,
            size: 0,
            style: 0,
            t: false,
            thickness: 0,
            useAlpha: false,
            useWeaponValue: false
        };

        let byte2 = dec2bin(bytes[2]);
        if (byte2.length === 8 && byte2.startsWith('1')) {
            byte2 = byte2.padStart(32, '1');
            crosshair.gap = Math.ceil(~~parseInt(byte2, 2) / 10);
        } else {
            crosshair.gap = Math.floor(bytes[2] / 10);
        }
        crosshair.gap = clamp(crosshair.gap, -12, 12);

        crosshair.outlineThickness = clamp(bytes[3] / 2, 0, 3);
        crosshair.r = clamp(bytes[4], 0, 255);
        crosshair.g = clamp(bytes[5], 0, 255);
        crosshair.b = clamp(bytes[6], 0, 255);
        crosshair.alpha = clamp(bytes[7], 0, 255);

        const byte10 = dec2bin(bytes[10]);
        crosshair.outline = parseInt(byte10.substring(4, 5), 2) === 1;
        crosshair.color = clamp(parseInt(byte10.substring(5, 8), 2), 1, 5);

        // thickness max 6
        crosshair.thickness = clamp(bytes[12] / 10, 0, 6);

        const byte13 = dec2bin(bytes[13]).padStart(8, '0');
        crosshair.t = parseInt(byte13.substring(0, 1), 2) === 1;
        crosshair.useAlpha = parseInt(byte13.substring(1, 2), 2) === 1;
        crosshair.useWeaponValue = parseInt(byte13.substring(2, 3), 2) === 1;
        crosshair.dot = parseInt(byte13.substring(3, 4), 2) === 1;
        crosshair.style = clamp(parseInt(byte13.substring(4, 7), 2), 0, 5);

        const byte14 = dec2bin(bytes[14]).padStart(8, '0');
        const byte15 = dec2bin(bytes[15]);

        crosshair.size = clamp(Math.ceil(parseInt(byte15 + byte14, 2) / 10), 0, 100);

        return crosshair;
    } catch (e) {
        return null;
    }
};

export const encode = (crosshair: Crosshair): string => {
    let bytes = [
        1,
        (crosshair.gap * 10),
        Math.min(6, crosshair.outlineThickness * 2),
        crosshair.r,
        crosshair.g,
        crosshair.b,
        crosshair.alpha,
        7,
        30,
        53,
    ];

    bytes.splice(9, 0, parseInt(`1010${crosshair.outline ? 1 : 0}${dec2bin(crosshair.color).padStart(3, '0')}`, 2));
    bytes.push(Math.min(63, crosshair.thickness * 10));
    bytes.push(parseInt(`${crosshair.t ? 1 : 0}${crosshair.useAlpha ? 1 : 0}${crosshair.useWeaponValue}${crosshair.dot ? 1 : 0}${dec2bin(crosshair.style).padStart(3, '0')}0`, 2));

    const sizeBin = dec2bin(crosshair.size * 10).padStart(11, '0');
    bytes.push(parseInt(sizeBin.substring(sizeBin.length - 8), 2));
    bytes.push(parseInt(sizeBin.substring(0, sizeBin.length - 8), 2));

    bytes = bytes.concat([0, 0]);

    let checksum = dec2bin(bytes.reduce((a, v) => a + v)).padStart(3, '0');
    checksum = checksum.substring(checksum.length - 8, checksum.length);
    bytes.unshift(parseInt(checksum, 2));

    const hex = bytesToHex(bytes);

    let total = BigInt(hex);

    let c = '';
    let rem = BigInt(0);
    Array.from({ length: 25 }).forEach(() => {
        rem = total % DICTIONARY_LENGTH;
        c += DICTIONARY[Number(rem)];
        total = total / DICTIONARY_LENGTH;
    });

    return `CSGO-${c.substring(0, 5)}-${c.substring(5, 5)}-${c.substring(10, 5)}-${c.substring(15, 5)}-${c.substring(20, 5)}`;
};
