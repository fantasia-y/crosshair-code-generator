/* eslint-disable no-bitwise */
const BigInt = require('big-integer');

const DICTIONARY = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789';
const DICTIONARY_LENGTH = BigInt(DICTIONARY.length);

export const SHARECODE_PATTERN = /CSGO(-?[\w]{5}){5}$/;

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => (`0${(byte & 0xff).toString(16)}`).slice(-2)).join('');
}

function stringToByteArray(str) {
  const bytes = [];

  for (let i = 0; i < str.length; i += 2) {
    bytes.push(parseInt(str.slice(i, i + 2), 16));
  }

  return bytes;
}

function dec2bin(dec) {
  const bin = (dec >>> 0).toString(2);
  return bin.padStart(3, '0');
}

function valueRange(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export const checkCode = (code) => code && code.match(SHARECODE_PATTERN);

export const decode = (code) => {
  if (code === undefined || !code.match(SHARECODE_PATTERN)) {
    return null;
  }

  try {
    const shareCode = code.replace(/CSGO|-/g, '');
    const chars = Array.from(shareCode).reverse();
    let big = BigInt(0);
    chars.forEach((_, i) => {
      big = big.multiply(DICTIONARY_LENGTH).plus(BigInt(DICTIONARY.indexOf(chars[i])));
    });

    const str = big.toString(16).padStart(36, '0');
    const bytes = stringToByteArray(str);

    const crosshair = {
      gap: 0,
      outlineThickness: 0,
      r: 0,
      g: 0,
      b: 0,
      alpha: 0,
      outline: 0,
      color: 0,
      thickness: 0,
      t: 0,
      useAlpha: 0,
      useweaponvalue: 0,
      dot: 0,
      style: 0,
      size: 0,
    };

    // gap max (-)12
    // var number = Math.min(Math.max(parseInt(number), MIN), MAX);
    let byte2 = dec2bin(bytes.slice(2, 3));
    if (byte2.length === 8 && byte2.startsWith('1')) {
      byte2 = byte2.padStart(32, '1');
      crosshair.gap = Math.ceil(~~parseInt(byte2, 2) / 10);
    } else {
      crosshair.gap = Math.floor(bytes.slice(2, 3) / 10);
    }
    crosshair.gap = valueRange(crosshair.gap, -12, 12);

    crosshair.outlineThickness = valueRange(bytes.slice(3, 4) / 2, 0, 3);
    crosshair.r = valueRange(bytes.slice(4, 5), 0, 255);
    crosshair.g = valueRange(bytes.slice(5, 6), 0, 255);
    crosshair.b = valueRange(bytes.slice(6, 7), 0, 255);
    crosshair.alpha = valueRange(bytes.slice(7, 8), 0, 255);

    const byte11 = dec2bin(bytes.slice(10, 11));
    crosshair.outline = parseInt(byte11.substring(4, 5), 2) === 1;
    crosshair.color = valueRange(parseInt(byte11.substring(5, 8), 2), 1, 5);

    // thickness max 6
    crosshair.thickness = valueRange(bytes.slice(12, 13) / 10, 0, 6);

    const byte14 = dec2bin(bytes.slice(13, 14)).padStart(8, '0');
    crosshair.t = parseInt(byte14.substring(0, 1), 2) === 1;
    crosshair.useAlpha = parseInt(byte14.substring(1, 2), 2) === 1;
    crosshair.useweaponvalue = parseInt(byte14.substring(2, 3), 2);
    crosshair.dot = parseInt(byte14.substring(3, 4), 2) === 1;
    crosshair.style = valueRange(parseInt(byte14.substring(4, 7), 2), 0, 5);

    const byte15 = dec2bin(bytes.slice(14, 15)).padStart(8, '0');
    const byte16 = dec2bin(bytes.slice(15, 16));

    crosshair.size = valueRange(Math.ceil(parseInt(byte16 + byte15, 2) / 10), 0, 100);

    return crosshair;
  } catch (e) {
    return null;
  }
};

export const encode = (crosshair) => {
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
  bytes.push(parseInt(`${crosshair.t ? 1 : 0}${crosshair.useAlpha ? 1 : 0}${crosshair.useweaponvalue}${crosshair.dot ? 1 : 0}${dec2bin(crosshair.style).padStart(3, '0')}0`, 2));

  const sizeBin = dec2bin(crosshair.size * 10).padStart(11, '0');
  bytes.push(parseInt(sizeBin.substring(sizeBin.length - 8), 2));
  bytes.push(parseInt(sizeBin.substring(0, sizeBin.length - 8), 2));

  bytes = bytes.concat([0, 0]);

  let checksum = dec2bin(bytes.reduce((a, v) => a + v)).padStart(3, '0');
  checksum = checksum.substring(checksum.length - 8, checksum.length);
  checksum = parseInt(checksum, 2);
  bytes.unshift(checksum);

  const hex = bytesToHex(bytes);

  let total = BigInt(hex, 16);

  let c = '';
  let rem = BigInt(0);
  Array.from({ length: 25 }).forEach(() => {
    rem = total.mod(DICTIONARY_LENGTH);
    c += DICTIONARY[rem];
    total = total.divide(DICTIONARY_LENGTH);
  });

  return `CSGO-${c.substr(0, 5)}-${c.substr(5, 5)}-${c.substr(10, 5)}-${c.substr(15, 5)}-${c.substr(20, 5)}`;
};
