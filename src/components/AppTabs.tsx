import { FileImage, Film, Type } from "lucide-react";
import type { AppTab } from "../types/ascii";

type AppTabsProps = {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

export function AppTabs({ activeTab, onChange }: AppTabsProps) {
  return (
    <nav className="tabs" aria-label="转换类型">
      <button className={activeTab === "image" ? "active" : ""} onClick={() => onChange("image")}>
        <FileImage size={17} />
        图片转字符画
      </button>
      <button className={activeTab === "video" ? "active" : ""} onClick={() => onChange("video")}>
        <Film size={17} />
        视频转字符画
      </button>
      <button className={activeTab === "text" ? "active" : ""} onClick={() => onChange("text")}>
        <Type size={17} />
        文字转字符画
      </button>
    </nav>
  );
}
