// Home-screen widget bridge (enabled by scripts/enable-widget.js). Writes the day's data into the shared App Group,
// where the SwiftUI widget (targets/widget) reads it, then asks iOS to refresh the widget.
import { ExtensionStorage } from '@bacons/apple-targets';
const store = new ExtensionStorage('group.space.kinzhal.hanzipath');
export function saveWidget(data) {
  try { store.set('widget', JSON.stringify(data || {})); ExtensionStorage.reloadWidget(); } catch {}
}
