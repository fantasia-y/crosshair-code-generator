# CS:GO Crosshair Sharecode Generator

## Installation

Using npm:
````bash
$ npm install crosshair-code-generator
````

Using yarn:
````bash
$ yarn add crosshair-code-generator
````

## Examples

### CommonJS

```js
const crosshairCodeGenerator = require('crosshair-code-generator');

// ...
```

```js
import { checkCode, decode, encode } from 'crosshair-code-generator';

checkCode('CSGO-qBD4P-q9uNy-xrYjf-QrW5O-BaBpF'); // true
checkCode('everything else'); // false

decode('CSGO-qBD4P-q9uNy-xrYjf-QrW5O-BaBpF');
/**
{
    useAlpha: true,
    alpha: 255,
    color: 2,
    r: 0,
    g: 0,
    b: 0,
    size: 3,
    style: 4,
    gap: -2,
    thickness: 1,
    dot: false,
    outline: false,
    outlineThickness: 1,
    t: false,
    useWeaponValue: false
}
**/

encode({
    useAlpha: true,
    alpha: 255,
    color: 1,
    r: 0,
    g: 0,
    b: 0,
    size: 4,
    style: 4,
    gap: -6,
    thickness: 1,
    dot: false,
    outline: false,
    outlineThickness: 1,
    t: false,
    useWeaponValue: false
}); // CSGO-hUNF5-Jwei8-CG9zB-uYNXw-dvurD
 
```