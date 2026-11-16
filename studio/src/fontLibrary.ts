// 字体库：全部为 OFL-1.1 开源授权，可免费商用。按调性选用，不要整片只用一种字。
import "@fontsource/noto-serif-sc/400.css";
import "@fontsource/noto-serif-sc/700.css";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/lxgw-wenkai/500.css";
import "@fontsource/ma-shan-zheng/400.css";
import "@fontsource/zhi-mang-xing/400.css";
import "@fontsource/liu-jian-mao-cao/400.css";
import "@fontsource/long-cang/400.css";
import "@fontsource/zcool-xiaowei/400.css";
import "@fontsource/zcool-qingke-huangyou/400.css";
import "@fontsource/zcool-kuaile/400.css";

export type FontEntry = { family: string; name: string; tone: string };

export const FONTS: FontEntry[] = [
  { family: "Noto Serif SC", name: "思源宋体", tone: "标题、顿悟句、典籍引文：庄重、克制" },
  { family: "Noto Sans SC", name: "思源黑体", tone: "字幕、图示、数据：清晰、中性" },
  { family: "LXGW WenKai", name: "霞鹜文楷", tone: "手记、独白、书写感：温和、文气" },
  { family: "ZCOOL XiaoWei", name: "站酷小薇", tone: "文艺标题：清瘦、带一点书卷气" },
  { family: "Ma Shan Zheng", name: "马善政毛笔楷书", tone: "古典、原典段落：毛笔正楷" },
  { family: "Zhi Mang Xing", name: "志莽行书", tone: "情绪高点、片头：行书的流动感" },
  { family: "Liu Jian Mao Cao", name: "刘建毛草", tone: "顿悟、反转的一瞬：草书，慎用" },
  { family: "Long Cang", name: "龙藏体", tone: "随手笔记、批注：轻松的手写" },
  { family: "ZCOOL QingKe HuangYou", name: "站酷庆科黄油体", tone: "冲击性大字：封面、强调" },
  { family: "ZCOOL KuaiLe", name: "站酷快乐体", tone: "轻松、俏皮：基本不用于本系列" },
];
