import { useState } from "react";
import { AppTabs } from "./components/AppTabs";
import { ImageAsciiTab } from "./components/ImageAsciiTab";
import { TextAsciiTab } from "./components/TextAsciiTab";
import { VideoAsciiTab } from "./components/VideoAsciiTab";
import type { AppTab } from "./types/ascii";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("image");

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="workspace-header">
          <div>
            <h1>字符画转换器</h1>
            <p>图片和文字转等宽字符画，面向本地桌面工作流。</p>
          </div>
          <AppTabs activeTab={activeTab} onChange={setActiveTab} />
        </header>
        {activeTab === "image" && <ImageAsciiTab />}
        {activeTab === "video" && <VideoAsciiTab />}
        {activeTab === "text" && <TextAsciiTab />}
      </section>
    </main>
  );
}
