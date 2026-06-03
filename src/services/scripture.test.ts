import { buildScriptureKey, hasLikelyScripture, parseScriptureLocal } from './scripture';

describe('mobile scripture helpers', () => {
  it('parses compact and lowercase references', () => {
    expect(parseScriptureLocal('Jn3:16')[0]).toMatchObject({
      reference: 'John 3:16',
      key: 'JHN.3.16',
      book: 'JHN',
      chapter: 3,
      verse: 16,
      verseEnd: 16,
    });

    expect(parseScriptureLocal('1cor13:4-7')[0]).toMatchObject({
      reference: '1 Corinthians 13:4-7',
      key: '1CO.13.4-7',
      book: '1CO',
      chapter: 13,
      verse: 4,
      verseEnd: 7,
    });
  });

  it('parses word and roman ordinals with verse markers', () => {
    expect(parseScriptureLocal('First John 4 v 8')[0]).toMatchObject({
      reference: '1 John 4:8',
      key: '1JN.4.8',
    });

    expect(parseScriptureLocal('ii tim 1 verse 7')[0]).toMatchObject({
      reference: '2 Timothy 1:7',
      key: '2TI.1.7',
    });
  });

  it('requires a verse for inline detection', () => {
    expect(hasLikelyScripture('John 3')).toBe(false);
    expect(hasLikelyScripture('John 3 v 16')).toBe(true);
  });

  it('treats a plain space as a chapter/verse separator in loose mode', () => {
    // The composer scripture picker opts into loose mode so "John 3 16"
    // (space-separated, no colon) resolves to a usable reference.
    expect(parseScriptureLocal('John 3 16', { looseSeparator: true })[0]).toMatchObject({
      reference: 'John 3:16',
      key: 'JHN.3.16',
      book: 'JHN',
      chapter: 3,
      verse: 16,
      verseEnd: 16,
    });

    expect(parseScriptureLocal('Acts 2 38-39', { looseSeparator: true })[0]).toMatchObject({
      reference: 'Acts 2:38-39',
      key: 'ACT.2.38-39',
      chapter: 2,
      verse: 38,
      verseEnd: 39,
    });

    // Numbered books keep their leading ordinal.
    expect(parseScriptureLocal('1 John 4 8', { looseSeparator: true })[0]).toMatchObject({
      reference: '1 John 4:8',
      key: '1JN.4.8',
    });
  });

  it('keeps inline detection strict so prose does not auto-link', () => {
    // Without loose mode a plain space is NOT a separator, so captions like
    // "I read John 3 16 times" never auto-link.
    expect(parseScriptureLocal('John 3 16')).toHaveLength(0);
    expect(hasLikelyScripture('John 3 16')).toBe(false);
  });

  it('normalizes scripture keys without translation', () => {
    expect(buildScriptureKey('jhn', 3, 16)).toBe('JHN.3.16');
    expect(buildScriptureKey('1co', 13, 4, 7)).toBe('1CO.13.4-7');
  });
});
