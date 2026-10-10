import { describe, expect, it } from 'vitest';
import { handleFrom, instagramPostUrl } from '../src/lib/site';

describe('handleFrom', () => {
  it('reads the account name from profile links', () => {
    expect(handleFrom('https://www.instagram.com/lina.salon/', 'instagram.com')).toBe('lina.salon');
    expect(handleFrom('https://www.tiktok.com/@lina.salon?lang=nl', 'tiktok.com')).toBe('lina.salon');
    expect(handleFrom('instagram.com/lina_salon', 'instagram.com')).toBe('lina_salon');
  });

  it('accepts a bare handle with or without @', () => {
    expect(handleFrom('@lina.salon', 'tiktok.com')).toBe('lina.salon');
    expect(handleFrom('lina.salon', 'instagram.com')).toBe('lina.salon');
  });

  it('rejects anything that is not a valid account name', () => {
    expect(handleFrom('lina"><script>', 'instagram.com')).toBeUndefined();
    expect(handleFrom('https://www.instagram.com/a b/', 'instagram.com')).toBeUndefined();
  });

  it('returns nothing for empty links, the bare site, or the wrong platform', () => {
    expect(handleFrom('', 'instagram.com')).toBeUndefined();
    expect(handleFrom('https://www.instagram.com/', 'instagram.com')).toBeUndefined();
    expect(handleFrom('https://www.tiktok.com/@x', 'instagram.com')).toBeUndefined();
  });
});

describe('instagramPostUrl', () => {
  it('normalises post and reel links (with or without tracking params)', () => {
    expect(instagramPostUrl('https://www.instagram.com/p/C8xYz12AbCd/?igsh=abc')).toBe('https://www.instagram.com/p/C8xYz12AbCd/');
    expect(instagramPostUrl('instagram.com/reel/DA1b2C3d4E5/')).toBe('https://www.instagram.com/reel/DA1b2C3d4E5/');
    expect(instagramPostUrl('https://www.instagram.com/lina.salon/p/C8xYz12AbCd/')).toBe('https://www.instagram.com/p/C8xYz12AbCd/');
  });

  it('ignores profile links and other sites', () => {
    expect(instagramPostUrl('https://www.instagram.com/lina.salon/')).toBeUndefined();
    expect(instagramPostUrl('https://example.com/p/abc')).toBeUndefined();
  });
});
