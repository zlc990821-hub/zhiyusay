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
// 中文网字计划（只收录免费可商用字体），按调性挑选的 20 款
import "@chinese-fonts/rzjkxzdmh/dist/nzgrKangxi/result.css";
import "@chinese-fonts/hldqjt/dist/qiji-fallback/result.css";
import "@chinese-fonts/jhlst/dist/京華老宋体v2_002/result.css";
import "@chinese-fonts/hwmct/dist/汇文明朝体/result.css";
import "@chinese-fonts/zjmc/dist/装甲明朝体/result.css";
import "@chinese-fonts/sypxzs/dist/思源屏显臻宋/result.css";
import "@chinese-fonts/fhst/dist/飞花宋体/result.css";
import "@chinese-fonts/zqfs/dist/ZhuqueFangsong-Regular/result.css";
import "@chinese-fonts/ysbzt/dist/峄山碑篆体/result.css";
import "@chinese-fonts/xuandongkaishu/dist/XuandongKaishu/result.css";
import "@chinese-fonts/ysyrxk/dist/slideyouran-Regular2_0/result.css";
import "@chinese-fonts/rzjryzzk/dist/nzgrRuYinZouZhangKai/result.css";
import "@chinese-fonts/jxzk/dist/江西拙楷/result.css";
import "@chinese-fonts/hlxsjt/dist/鸿雷行书简体/result.css";
import "@chinese-fonts/rmjzqpybxs/dist/瑞美加张清平硬笔行书/result.css";
import "@chinese-fonts/qtbfsxt/dist/千图笔锋手写体/result.css";
import "@chinese-fonts/cezkzdbs/dist/仓耳周珂正大榜书/result.css";
import "@chinese-fonts/ysbth/dist/优设标题黑/result.css";
import "@chinese-fonts/dyh/dist/SmileySans-Oblique/result.css";
import "@chinese-fonts/lxgwmanhei/dist/LXGWMarkerGothic/result.css";

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
  // —— 以下来自中文网字计划 ——
  { family: "nzgrKangxi", name: "润植家康熙字典美化体", tone: "古籍、原典引文：康熙字典的刻本感（自动显示为繁体）" },
  { family: "QIJIFALLBACK", name: "黄令东齐伋体", tone: "古籍刻本：明代刻书风格，典雅" },
  { family: "KingHwa_OldSong", name: "京華老宋体", tone: "老派印刷：民国书报的旧时光" },
  { family: "Huiwen-mincho", name: "汇文明朝体", tone: "文艺标题：老式铅字明朝体" },
  { family: "SoukouMincho", name: "装甲明朝体", tone: "硬朗标题：棱角分明的明朝体（缺字较多，如「离」，用前先检查）" },
  { family: "Source Han Serif CN for Display", name: "思源屏显臻宋", tone: "大标题：为屏幕优化的宋体" },
  { family: "FlyFlowerSong", name: "飞花宋体", tone: "诗性标题：轻盈的宋体" },
  { family: "Zhuque Fangsong (technical preview)", name: "朱雀仿宋", tone: "典雅引文、注释：仿宋" },
  { family: "峄山碑篆体", name: "峄山碑篆体", tone: "远古、天元、神秘感：小篆" },
  { family: "XuandongKaishu", name: "玄冬楷书", tone: "庄重楷书：原典、题字" },
  { family: "slideyouran", name: "演示悠然小楷", tone: "清雅小楷：独白、诗句" },
  { family: "nzgrRuYinZouZhangKai", name: "润植家如印奏章楷", tone: "奏章楷书：古代文书感" },
  { family: "jiangxizhuokai", name: "江西拙楷", tone: "拙朴楷书：温度、人情" },
  { family: "hongleixingshu", name: "鸿雷行书简体", tone: "行书：情绪高点、题字" },
  { family: "瑞美加张清平硬笔行书", name: "瑞美加张清平硬笔行书", tone: "硬笔手写：研究笔记、批注" },
  { family: "qiantubifengshouxieti", name: "千图笔锋手写体", tone: "手写：随手记下的念头" },
  { family: "TsangerZhoukeZhengdabangshu", name: "仓耳周珂正大榜书", tone: "榜书大字：片头、封面、冲击" },
  { family: "YouSheBiaoTiHei", name: "优设标题黑", tone: "现代冲击标题：封面" },
  { family: "Smiley Sans Oblique", name: "得意黑", tone: "现代斜体：科技、速度感" },
  { family: "LXGW Marker Gothic", name: "霞鹜漫黑", tone: "马克笔：批注、圈画重点" },
];
