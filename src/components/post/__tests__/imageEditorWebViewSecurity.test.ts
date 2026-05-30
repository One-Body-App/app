import {
  buildLocalImageEditorModerationRuntime,
  shouldAllowImageEditorNavigation,
} from '../imageEditorWebViewSecurity';
import { LOCAL_VIDEO_MODERATION_BASE_URL } from '../videoModerationBridgeHtml';

describe('imageEditorWebViewSecurity', () => {
  it('builds a local nsfw runtime without remote nsfw imports', () => {
    const runtime = buildLocalImageEditorModerationRuntime();

    expect(runtime).toContain(LOCAL_VIDEO_MODERATION_BASE_URL);
    expect(runtime).toContain('window.__ONEBODY_GET_NSFW_MODEL__');
    expect(runtime).not.toContain('https://esm.sh/nsfwjs');
  });

  it('only allows expected editor navigation targets', () => {
    expect(shouldAllowImageEditorNavigation('about:blank')).toBe(true);
    expect(shouldAllowImageEditorNavigation(`${LOCAL_VIDEO_MODERATION_BASE_URL}model.json`)).toBe(
      true
    );
    expect(shouldAllowImageEditorNavigation('https://esm.sh/react@18.2.0?target=es2022')).toBe(
      true
    );
    expect(
      shouldAllowImageEditorNavigation(
        'https://scaleflex.cloudimg.io/v7/plugins/filerobot-image-editor/latest/filerobot-image-editor.min.js'
      )
    ).toBe(true);
    expect(shouldAllowImageEditorNavigation('https://example.com')).toBe(false);
  });
});
