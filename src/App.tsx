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
          <div className="brand-block">
            <div className="brand-mark" aria-hidden="true">
              @
            </div>
            <div>
              <h1>字符画工作台</h1>
              <p>图片、GIF、视频和文字转等宽字符画，所有处理都在本地完成。</p>
            </div>
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
