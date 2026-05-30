import {
  buildVideoModerationBridgeHtml,
  LOCAL_VIDEO_MODERATION_BASE_URL,
  shouldAllowVideoModerationNavigation,
} from '../videoModerationBridgeHtml';

describe('videoModerationBridgeHtml', () => {
  it('builds a local-only moderation bridge without remote esm imports', () => {
    const html = buildVideoModerationBridgeHtml({
      tfjsSource: 'window.tf = {};',
      nsfwjsSource: 'window.nsfwjs = { load: () => Promise.resolve({ classify: () => [] }) };',
      modelJson: '{"weightsManifest":[]}',
      modelShardBase64: 'AQID',
    });

    expect(html).toContain(LOCAL_VIDEO_MODERATION_BASE_URL);
    expect(html).toContain('window.nsfwjs.load(LOCAL_MODEL_BASE_URL)');
    expect(html).toContain('window.fetch = async');
    expect(html).not.toContain('https://esm.sh/');
  });

  it('only allows local bridge navigation', () => {
    expect(shouldAllowVideoModerationNavigation('about:blank')).toBe(true);
    expect(
      shouldAllowVideoModerationNavigation(`${LOCAL_VIDEO_MODERATION_BASE_URL}model.json`)
    ).toBe(true);
    expect(shouldAllowVideoModerationNavigation('https://esm.sh/nsfwjs')).toBe(false);
    expect(shouldAllowVideoModerationNavigation('https://example.com')).toBe(false);
  });
});
