import WidgetKit
import SwiftUI

// Data written by the app (src/widget.js) as JSON into the shared App Group.
struct WWord: Codable { let h: String; let p: String; let m: String }
struct WFest: Codable { let n: String; let zh: String; let d: Int; let ic: String }
struct WData: Codable { let streak: Int; let xp: Int; let done: Bool; let word: WWord?; let fest: WFest?; let lang: String }

struct Entry: TimelineEntry { let date: Date; let data: WData? }

struct Provider: TimelineProvider {
  func load() -> WData? {
    guard let s = UserDefaults(suiteName: "group.space.kinzhal.hanzipath")?.string(forKey: "widget"),
          let d = s.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(WData.self, from: d)
  }
  func placeholder(in context: Context) -> Entry { Entry(date: Date(), data: nil) }
  func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) { completion(Entry(date: Date(), data: load())) }
  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date().addingTimeInterval(3600)
    completion(Timeline(entries: [Entry(date: Date(), data: load())], policy: .after(next)))
  }
}

let ink = Color(red: 0.08, green: 0.04, blue: 0.04), red = Color(red: 0.69, green: 0.12, blue: 0.09), gold = Color(red: 0.89, green: 0.70, blue: 0.35), paper = Color(red: 0.96, green: 0.92, blue: 0.85)

struct WidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: Entry
  var ar: Bool { entry.data?.lang == "ar" }
  var body: some View {
    let d = entry.data
    VStack(alignment: .leading, spacing: 6) {
      HStack {
        Text("汉字之路").font(.system(size: 13, weight: .bold, design: .serif)).foregroundColor(gold)
        Spacer()
        Text("🔥 \(d?.streak ?? 0)").font(.system(size: 14, weight: .heavy)).foregroundColor(d?.done == true ? gold : paper)
      }
      if let w = d?.word {
        Text(w.h).font(.system(size: family == .systemSmall ? 30 : 38, weight: .bold, design: .serif)).foregroundColor(paper).minimumScaleFactor(0.5).lineLimit(1)
        Text(w.p).font(.system(size: 13, weight: .semibold)).foregroundColor(gold).lineLimit(1)
        Text(w.m).font(.system(size: 12)).foregroundColor(paper.opacity(0.85)).lineLimit(family == .systemSmall ? 1 : 2)
      } else {
        Text(ar ? "افتح التطبيق" : "Open the app").font(.system(size: 15, weight: .semibold)).foregroundColor(paper)
      }
      Spacer(minLength: 0)
      if family != .systemSmall, let f = d?.fest {
        Text("\(f.ic) \(f.zh) · \(f.n) · \(f.d == 0 ? (ar ? "اليوم" : "today") : (ar ? "بعد \(f.d) يومًا" : "in \(f.d) days"))")
          .font(.system(size: 11, weight: .medium)).foregroundColor(gold).lineLimit(1)
      } else if d?.done != true {
        Text(ar ? "درس قصير يحفظ سلسلتك" : "A quick lesson keeps your streak").font(.system(size: 11)).foregroundColor(gold).lineLimit(1)
      }
    }
    .padding(2)
    .containerBackground(for: .widget) { LinearGradient(colors: [ink, red.opacity(0.55)], startPoint: .topLeading, endPoint: .bottomTrailing) }
  }
}

@main
struct HanziWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "HanziWidget", provider: Provider()) { WidgetView(entry: $0) }
      .configurationDisplayName("Hanzi Path")
      .description("Streak, the word of the day and the next Chinese festival.")
      .supportedFamilies([.systemSmall, .systemMedium])
  }
}
