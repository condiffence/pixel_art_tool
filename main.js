/**
 * main.js - 应用主入口与UI事件绑定 (最终迭代版)
 */

// 1. 静态导入核心模块 (避免高频触发时的动态 import 开销)
import { initWebGL, renderPixelated, exportImage, resizeCanvas } from './gl/renderer.js';

// 2. 获取 DOM 元素
const canvas = document.getElementById('gl-canvas');
const imageInput = document.getElementById('imageInput');
const pixelSizeSlider = document.getElementById('pixelSize');
const pixelSizeValue = document.getElementById('pixelSizeValue');
const exportBtn = document.getElementById('exportBtn');
const placeholder = document.getElementById('placeholder');
const previewArea = document.querySelector('.preview-area');

// 新增：导出分辨率控制滑块
const exportScaleSlider = document.getElementById('exportScale'); 
const exportScaleValue = document.getElementById('exportScaleValue');

// 3. 应用状态管理
const state = {
    image: null,
    pixelSize: 8,
    exportScale: 1.0, 
    isReady: false
};

// 4. 初始化函数
async function init() {
    try {
        await initWebGL(canvas);
        state.isReady = true;
        
        bindEvents();
        initResizeObserver(); // 初始化响应式监听
        
        console.log('WebGL 像素化工具初始化成功');
    } catch (err) {
        console.error('初始化失败:', err);
        placeholder.textContent = 'WebGL 初始化失败，请检查浏览器兼容性';
    }
}

// 5. 核心：ResizeObserver 响应式适配
function initResizeObserver() {
    if (!previewArea) return;
    
    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            const { width, height } = entry.contentRect;
            // 防止容器折叠为 0 时引发 WebGL 报错
            if (width > 0 && height > 0 && state.isReady) {
                resizeCanvas(canvas, width, height);
            }
        }
    });
    
    resizeObserver.observe(previewArea);
}

// 6. 事件绑定
function bindEvents() {
    // 图片选择事件
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        loadImage(file);
    });

    // 预览像素块大小控制 (加入防抖机制)
    let renderTimeout = null;
    pixelSizeSlider.addEventListener('input', (e) => {
        state.pixelSize = parseInt(e.target.value, 10);
        pixelSizeValue.textContent = state.pixelSize;
        
        // 清除上一个定时器，确保拖动停止后 1ms 才真正渲染
        clearTimeout(renderTimeout);
        renderTimeout = setTimeout(() => {
            if (state.image && state.isReady) {
                renderPixelated(state.image, state.pixelSize);
            }
        }, 1);
    });

    // 导出倍率控制
    if (exportScaleSlider) {
        exportScaleSlider.addEventListener('input', (e) => {
            state.exportScale = parseFloat(e.target.value);
            if (exportScaleValue) {
                exportScaleValue.textContent = state.exportScale.toFixed(1);
            }
        });
    }

    // 导出按钮点击事件
    exportBtn.addEventListener('click', () => {
        if (!state.image) return;
        // 直接调用静态导入的函数
        exportImage(canvas.width, canvas.height);
    });
}
// 7. 图片加载逻辑
function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
            state.image = img;
            placeholder.style.display = 'none';
            exportBtn.disabled = false;
            
            // 使用 requestAnimationFrame 确保在浏览器完成重排后再获取尺寸并渲染
            // 这比 setTimeout(0) 更贴合渲染管线，能有效避免拿到旧的布局尺寸
            requestAnimationFrame(() => {
                if (!state.isReady) return; 
                const rect = previewArea.getBoundingClientRect();
                // 增加防御性判断，防止极端情况下尺寸为 0
                if (rect.width > 0 && rect.height > 0) {
                    resizeCanvas(canvas, rect.width, rect.height,img);
                    renderPixelated(state.image, state.pixelSize);
                }
            });
        };
        
        img.onerror = () => {
            placeholder.textContent = '图片加载失败，请重试';
            placeholder.style.display = 'block';
        };
        
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);

}

// 8. 启动应用
init();