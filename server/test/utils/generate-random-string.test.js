const { expect } = require('chai');

const generateRandomString = require('../../api/helpers/utils/generate-random-string');

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// The helper makes the secret half of every API key (generate-api-key.js).
describe('generate-random-string', () => {
  it('returns the requested number of characters from the 62-character alphabet', () => {
    const result = generateRandomString.fn({ size: 32 });

    expect(result).to.match(/^[0-9A-Za-z]{32}$/);
  });

  it('draws every character equally often', () => {
    // 2000 draws expected per character, a standard deviation of about 45, so
    // 15% is more than six of them. The biased `randomBytes()[i] % 62` this
    // replaced gave '0'-'7' about 2420 each, 21% over, and fails here.
    const perChar = 2000;
    const result = generateRandomString.fn({ size: CHARS.length * perChar });

    const counts = {};
    [...result].forEach((char) => {
      counts[char] = (counts[char] || 0) + 1;
    });

    const outliers = [...CHARS].filter(
      (char) => Math.abs((counts[char] || 0) - perChar) > perChar * 0.15,
    );
    expect(outliers.map((char) => `${char}=${counts[char] || 0}`)).to.deep.equal([]);
  });
});
