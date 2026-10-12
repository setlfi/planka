/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const crypto = require('crypto');

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

module.exports = {
  sync: true,

  inputs: {
    size: {
      type: 'number',
      required: true,
    },
  },

  fn(inputs) {
    let result = '';
    for (let i = 0; i < inputs.size; i += 1) {
      // Not `randomBytes()[i] % 62`: 256 is not a multiple of 62, so that drew
      // '0'-'7' a quarter more often than the rest (CodeQL
      // js/biased-cryptographic-random). randomInt rejects the excess instead.
      result += CHARS[crypto.randomInt(CHARS.length)];
    }

    return result;
  },
};
