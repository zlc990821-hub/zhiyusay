# EP02 素材清单（原图 / 经典示例）

更新：2026-11-26 ｜ 起因：用户要求，网上已有原图或流传很广的经典例子的，**用原图，不用代码重画**；先收集素材，再定展示形式。

许可信息核对自维基共享资源 / 维基百科文件页（2026-11-26 当日所见）。CC BY-SA 素材：视频简介里须署名并注明许可；作者对原图做二次修改时，修改后的版本也须按 CC BY-SA 开放。

## 一、素材表

| # | 片段 | 素材 | 来源 | 许可 | 署名 | 状态 |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| 1 | 0:00 盲点实验 | 盲点测试图（叉 + 白点，带中英文说明） | [TEST_TACHE_AVEUGLE.png](https://commons.wikimedia.org/wiki/File:TEST_TACHE_AVEUGLE.png) | CC BY-SA 4.0 | Dominique222 | 待下载 |
| 1b | 同上（备选） | 盲点测试图 | [Blind_spot_test.svg](https://commons.wikimedia.org/wiki/File:Blind_spot_test.svg) | 公有领域 | Frisko | 待下载 |
| 2 | 0:19 盲点在哪 | 人眼结构示意图（标出视神经、盲点） | [Schematic_diagram_of_the_human_eye_en.svg](https://commons.wikimedia.org/wiki/File:Schematic_diagram_of_the_human_eye_en.svg) | CC BY-SA 3.0 | Rhcastilhos, Jmarchn | 待下载 |
| 3 | 0:53 眼球跳动 | 雅布斯（Yarbus 1967）眼动轨迹：看列宾《不速之客》时的视线路径 | [Yarbus_The_Visitor.jpg](https://commons.wikimedia.org/wiki/File:Yarbus_The_Visitor.jpg) | 公有领域（上传者声明） | 数据：A. L. Yarbus, 1967 | 待下载 |
| 3b | 同上 | 列宾《不速之客》原画 | [Ilya_Repin_Unexpected_visitors.jpg](https://commons.wikimedia.org/wiki/File:Ilya_Repin_Unexpected_visitors.jpg) | 公有领域 | 伊里亚·列宾，1884–88，特列季亚科夫画廊 | 待下载 |
| 3c | 同上（备选） | 人脸上的眼动轨迹 | [Szakkad.jpg](https://commons.wikimedia.org/wiki/File:Szakkad.jpg) | CC BY-SA 2.0 | SpooSpa / Simon Viktória | 待下载（仅 401×264，偏小） |
| 4 | 1:22 光谱 | 线性可见光谱 | [Linear_visible_spectrum.svg](https://commons.wikimedia.org/wiki/File:Linear_visible_spectrum.svg) | 公有领域 | Gringer | 待下载 |
| 5 | 1:35 品红 | CIE 1931 色度图（底边“紫红线”= 光谱里没有的颜色） | [CIE1931xy_blank.svg](https://commons.wikimedia.org/wiki/File:CIE1931xy_blank.svg) | 公有领域 | BenRG | 待下载 |
| 6 | 1:53 裙子 | 2015 年“那条裙子”原照片 | [维基百科文件页](https://en.wikipedia.org/wiki/File:The_dress_blueblackwhitegold.jpg) | **非自由版权**（摄影者 Cecilia Bleasdale；维基百科以合理使用收录） | Cecilia Bleasdale | **需你决定是否使用** |
| 7 | 2:16 棋盘错觉 | 阿德尔森棋盘阴影错觉原图 | [Checker_shadow_illusion.svg](https://commons.wikimedia.org/wiki/File:Checker_shadow_illusion.svg) | CC BY-SA 4.0；MIT 原页面另声明可自由复制传播 | Edward H. Adelson（矢量化：Pbroks13） | **已下载** `assets/checker_shadow.svg` |
| 7b | 2:20 证明图 | 同一张图加两条灰色竖条，证明 A、B 同色 | [Grey_square_optical_illusion_proof2.svg](https://commons.wikimedia.org/wiki/File:Grey_square_optical_illusion_proof2.svg) | “版权所有但允许任意使用”（非标准许可） | 基于 Edward H. Adelson | 待下载 |
| 8 | 2:42 受控的幻觉 | 阿尼尔·赛斯照片（2019） | [Congreso_Futuro_-_2019-01-14_-_09.jpg](https://commons.wikimedia.org/wiki/File:Congreso_Futuro_-_2019-01-14_-_09.jpg) | CC BY-SA 4.0 | Carlos Figueroa Rojas | 待下载 |
| 9 | 3:09 蜜蜂眼里的花 | 猴面花：可见光 vs 紫外光对比照（紫外下出现蜜导） | [Mimulus_nectar_guide_UV_VIS.jpg](https://commons.wikimedia.org/wiki/File:Mimulus_nectar_guide_UV_VIS.jpg) | CC BY-SA 3.0（可选） | Plantsurfer | 待下载 |
| 10 | 3:27 康德 | 康德肖像（贝克尔，1768） | [Immanuel_Kant_-_Gemaelde_1.jpg](https://commons.wikimedia.org/wiki/File:Immanuel_Kant_-_Gemaelde_1.jpg) | 公有领域 | Johann Gottlieb Becker | 待下载 |

**下载受阻说明**：维基共享资源对本容器 IP 返回限速（HTTP 429，缩略图地址也被限）。第 7 项已下载；已设 2 小时后自动重试（低频、合规请求，不伪装浏览器），或由用户在浏览器里另存后发来。

**已定（用户授权由我决定，2026-11-26）**：展示形式采用 A+B 结合——需要观众亲自验证的实验图（盲点、棋盘、裙子）全屏（B），其余原图用“粒子显影”（A）。裙子照片照用原图并署名摄影者，风险写入发布文案。

**组件已就绪**：`studio/src/stylec/sampler.ts` 的 `sampleImage`（按原图像素取位置和颜色）+ `ImageCard.tsx`（显影 + 金框 + 署名），已用棋盘原图测试通过（合成 `ImgTest`）。

## 二、展示形式（待用户选定）

**方案 A：原图“浮现”在粒子世界里（推荐）**
- 原图放在世界坐标里，四周一圈金色细框，像一张悬在空中的展品。
- 入场：粒子先聚成这张图的大致轮廓和颜色，再“显影”成真实原图；出场：原图碎成粒子，流向下一个画面。保留风格 C 的连续感，图片本身完全是原版。
- 镜头在图上推、摇，配合解说指向细节（比如推到 A、B 两格；沿着雅布斯的视线路径移动）。

**方案 B：原图全屏 + 简洁标注**
- 关键实验（盲点图、棋盘错觉、裙子）全屏显示原图，只加箭头、圈注、遮罩这类最少的标注，方便观众看清和自己验证。
- 段落之间仍用粒子转场衔接，图片段落本身不加粒子。

**方案 C：纪录片式**
- 原图配缓慢推拉（肯·伯恩斯效果）、轻微景深和胶片质感，粒子只在开头、片名和结尾出现。

建议：实验类（盲点、棋盘、裙子）用 B 的全屏，保证看得清、能验证；其余（眼睛结构、眼动轨迹、光谱、CIE 图、赛斯、蜜蜂花、康德）用 A 的“粒子显影”，保留系列风格。


## 三、实际使用（2026-11-26 v2 渲染）
| 片段 | 文件 | 来源 | 备注 |
| :-- | :-- | :-- | :-- |
| 盲点实验 | `blindspot_test.png` | 用户提供（蓝底、白点 + 十字），**水平翻转**以对应旁白“左边的叉、右边的点” | 原出处与许可未知；如需替换，可用公有领域的 Blind_spot_test.svg |
| 盲点在哪 | `eye_diagram.svg` | 维基共享资源下载 | CC BY-SA 3.0 |
| 眼球跳动 | `repin_unexpected.jpg`、`yarbus_visitor.jpg` | 用户提供 | 公有领域；雅布斯图 330px 偏小 |
| 光谱 / 品红 | `spectrum.png`、`cie1931.png` | 用户提供 | 透明底，卡片垫白底显示；均为公有领域 |
| 裙子 | `NONFREE_the_dress.jpg` | 用户提供 | 非自由版权，署名摄影者；不入 git |
| 棋盘错觉 | `checker_shadow.svg` | 维基共享资源下载 | CC BY-SA 4.0；“遮住周围”为在原图上标注（同色竖条，取色 rgb 111），未用证明图 |
| 受控的幻觉 | `anil_seth_2019.jpg` | 用户提供 | CC BY-SA 4.0 |
| 蜜蜂眼里的花 | `mimulus_uv_vis.jpg` | 用户提供 | CC BY-SA 3.0；先露可见光半边，再揭开紫外半边；三幅画框用其左右两半 |
| 康德 | `kant_portrait.jpg` | 用户提供 | 公有领域 |
