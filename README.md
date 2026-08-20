PixelCraft: WebGL Pixel Art & Perler Bead Generator / 像素工坊：WebGL 像素艺术与拼豆图纸生成器

Project Overview / 项目简介

PixelCraft is a pure static web application hosted entirely on GitHub Pages. By leveraging the computational power of the user's local device, this tool requires zero server-side processing. It is designed for pixel art enthusiasts and can make contribution to the popular "Perler Bead" (拼豆) crafting .

PixelCraft 是一个依托于 GitHub Pages 托管的纯静态网页应用。项目完全依赖用户终端的本地算力，无需任何服务器端资源。本工具专为像素风格爱好者打造，并可以在流行活动"拼豆"中做出一定辅助.

️ Core Technical Principles / 核心技术原理

The pixelation effect is achieved natively via WebGL. The rendering pipeline follows a specific two-pass approach:
FBO Rendering: The scene is first rendered into a custom-sized Framebuffer Object (FBO) with linear filtering strictly disabled.
Upscaling: The FBO texture is then sampled and rendered onto a larger physical pixel grid. 
This technique effectively downsamples the original image's texels and upscales them to larger pixel blocks, ensuring crisp, authentic pixel art aesthetics without blurry interpolation.

本项目的像素化效果完全基于 WebGL 原生实现。渲染管线采用特定的两遍式（Two-pass）处理逻辑：
FBO 渲染： 首先将场景渲染至自定义尺寸的帧缓冲区（FBO）中，并强制关闭线性过滤（Linear Filtering）。
放大重采样： 随后，将 FBO 纹理重新采样并渲染至更大的物理像素网格上。
该技术通过“先降采样少量纹素，再放大渲染至大像素区”的方式，确保了像素边缘的锐利度，避免了模糊插值，还原最纯粹的像素艺术美感。

Perler Bead Utility Functions / 拼豆专属辅助功能

To maximize practicality for Perler Bead crafting, PixelCraft will include the following dedicated helper functions<not yet>:
RGB to Color Code Mapping: Automatically maps any RGB pixel color to the closest available Perler Bead color code, ensuring accurate material preparation.
Real-time Hover Inspection: Listens to mouse cursor position and dynamically displays the exact bead color code for the pixel block currently under the cursor, streamlining the crafting process.

为提升在拼豆应用中的实用性，PixelCraft 可以内置以下专属辅助功能 < 未实现 >：
RGB 像素色号映射： 自动将任意 RGB 像素颜色映射为最接近的拼豆色号，方便玩家精准备料。
鼠标悬停色号检测： 实时监听鼠标位置，当光标停留在特定色块上时，动态显示该区域对应的拼豆色号，让拼豆过程更加直观高效。

Usage & Deployment / 使用与部署

Since this is a pure static site, you can easily deploy it using GitHub Pages. Simply push the code to your repository, enable GitHub Pages in the settings, and the application will be ready to use. All rendering and color mapping computations are handled entirely within your browser.

由于这是一个纯静态站点，您可以轻松通过 GitHub Pages 进行部署。只需将代码推送至您的仓库，在设置中开启 GitHub Pages 即可直接使用。所有的渲染与色号映射计算均在您的浏览器内本地完成。

