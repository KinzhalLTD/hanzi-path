# iOS home-screen widget (both apps)

Small and medium widget: 🔥 streak (gold once today's lesson is done), the word of the day (Hanzi Path: from the
learner's HSK level; Cipher Path: the term of the day with pinyin and meaning) and, on the medium size, the next
Chinese festival with a countdown. Refreshes hourly and whenever the app goes to the background.

Pieces
- Web: `widget.js` sends `{type:'widget', data}` (streak, xp, done, word, fest, lang) when the app is backgrounded.
- Native: `mobile/src/widget.js` – a no-op until enabled; then it writes JSON to the App Group
  `group.space.kinzhal.hanzipath` / `group.space.kinzhal.cipherpath` (ExtensionStorage) and reloads the widget.
- SwiftUI widget: `mobile/widget-template/widget/Widget.swift` + `expo-target.config.js` (built by
  `@bacons/apple-targets` during the EAS build – no Mac needed).

Enable (owner, once per app; from `mobile/`, Cloud Shell or Windows terminal):
```bash
npm run widget:enable -- YOUR_APPLE_TEAM_ID
npm run check:store
```
It installs `@bacons/apple-targets`, copies the widget to `targets/widget`, switches `src/widget.js` to the real bridge
and adds the plugin, `appleTeamId` and the App Group entitlement to `app.json`. EAS creates the App Group and the widget's
bundle id (`space.kinzhal.<app>.widget`) on the next build when it manages credentials. Not testable in the web preview;
check it on the iPhone after the first TestFlight build.
