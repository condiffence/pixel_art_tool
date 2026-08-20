/**
 * gl/renderer.js - 核心渲染管线与导出逻辑 (重构版)
 */
import { ShaderProgram } from './program.js';
import { Framebuffer } from './fbo.js';

let gl, program, fbo, imageTexture;
let quadVAO; // 全局复用的 VAO
let canvasWidth, canvasHeight;

// 缓存当前图片，用于导出时重新计算，避免重复上传
let currentImage = null; 
let currentImageSrc = null; 

/**
 * 初始化 WebGL 上下文及核心资源
 */
export async function initWebGL(canvas) {
    gl = canvas.getContext('webgl2', { 
        preserveDrawingBuffer: true, 
        antialias: false 
    });
    
    if (!gl) throw new Error('WebGL2 is not supported');

    // 初始化画布尺寸
    resizeCanvas(canvas);

    // 初始化着色器与 FBO
    program = new ShaderProgram(gl);
    fbo = new Framebuffer(gl);

    // 创建用于存储原图的纹理
    imageTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // 【优化】全局只创建一次全屏矩形 VAO
    quadVAO = createQuadVAO(gl, program);
}
/**
 * 响应窗口/容器尺寸变化，保持图片原始比例
 * @param {HTMLCanvasElement} canvas 
 * @param {number} [width] 
 * @param {number} [height] 
 * @param {HTMLImageElement} [imageOverride] 新增：允许传入特定图片来计算比例
 */
export function resizeCanvas(canvas, width, height, imageOverride) {
    const containerWidth = width || canvas.clientWidth;
    const containerHeight = height || canvas.clientHeight;

    if (containerWidth <= 0 || containerHeight <= 0) return;

    let finalWidth = containerWidth;
    let finalHeight = containerHeight;

    // 【修改点】优先使用传入的图片，如果没有则使用全局缓存
    const targetImage = imageOverride || currentImage;

    if (targetImage) {
        const imgRatio = targetImage.naturalWidth / targetImage.naturalHeight;
        const containerRatio = containerWidth / containerHeight;

        if (imgRatio > containerRatio) {
            finalWidth = containerWidth;
            finalHeight = Math.floor(containerWidth / imgRatio);
        } else {
            finalHeight = containerHeight;
            finalWidth = Math.floor(containerHeight * imgRatio);
        }
    }

    canvasWidth = Math.max(1, Math.floor(finalWidth));
    canvasHeight = Math.max(1, Math.floor(finalHeight));

    // 只有尺寸真正变化时才更新 DOM，避免闪烁
    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // 尺寸变化后必须重绘
        if (targetImage) {
            // 注意：这里需要确保 currentPixelSize 是最新的，或者从外部传入
            renderPixelated(targetImage, currentPixelSize || 1);
        }
    }
}

let currentPixelSize = 1; // 缓存当前像素块大小

/**
 * 核心渲染函数：图片 -> FBO(降采样) -> 屏幕(拉伸)
 */
export function renderPixelated(image, pixelSize) {
    if (!gl || !image) return;
    
    currentPixelSize = pixelSize;
    const isImageChanged = currentImageSrc !== image.src;
    
    // 1. 仅在图片源改变时上传纹理到 GPU
    if (isImageChanged) {
        currentImage = image;
        currentImageSrc = image.src;
        gl.bindTexture(gl.TEXTURE_2D, imageTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); 
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }

    // 2. 基于原图尺寸计算 FBO 目标尺寸 (保持绝对比例)
    const fboWidth = Math.max(2, Math.floor(image.naturalWidth / pixelSize));
    const fboHeight = Math.max(2, Math.floor(image.naturalHeight / pixelSize));
    fbo.resize(fboWidth, fboHeight);

    program.use();
    gl.bindVertexArray(quadVAO);

    // === Pass 1: 渲染到 FBO ===
    fbo.bind();
    gl.viewport(0, 0, fboWidth, fboHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawTexture(imageTexture);

    // === Pass 2: 渲染到屏幕 ===
    fbo.unbind();
    gl.viewport(0, 0, canvasWidth, canvasHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawTexture(fbo.texture);
}
export function exportImage(targetWidth, targetHeight) {
    if (!gl || !currentImage) return;

    // 1. 直接使用目标尺寸作为 FBO 尺寸 (严格保持传入的宽高)
    // 限制最小尺寸为 1，防止 WebGL 报错
    const fboWidth = Math.max(1, Math.floor(targetWidth));
    const fboHeight = Math.max(1, Math.floor(targetHeight));
    
    // 2. 渲染到 FBO
    fbo.resize(fboWidth, fboHeight);
    program.use();
    gl.bindVertexArray(quadVAO);
    
    fbo.bind();
    gl.viewport(0, 0, fboWidth, fboHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawTexture(imageTexture);
    fbo.unbind(); 

    // 3. 从 GPU 读取像素数据
    const pixels = new Uint8Array(fboWidth * fboHeight * 4);
    gl.readPixels(0, 0, fboWidth, fboHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    
    // 4. 准备离屏 Canvas 并写入像素
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = fboWidth;
    offscreenCanvas.height = fboHeight;
    const ctx = offscreenCanvas.getContext('2d');
    
    const imageData = ctx.createImageData(fboWidth, fboHeight);
    imageData.data.set(pixels);

    // 【优化】由于 WebGL 读取的像素是上下颠倒的，且 putImageData 不受 transform 影响
    // 我们创建一个临时 Canvas 来翻转图像，然后再绘制到目标 Canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = fboWidth;
    tempCanvas.height = fboHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imageData, 0, 0);

    ctx.imageSmoothingEnabled = false; // 保持像素风锐利边缘
    ctx.translate(0, fboHeight);
    ctx.scale(1, -1); // Y轴翻转
    ctx.drawImage(tempCanvas, 0, 0); // 绘制到目标 Canvas
    
    // 5. 触发下载
    offscreenCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pixelated_${fboWidth}x${fboHeight}_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png');
}
// --- 内部辅助函数 ---

function createQuadVAO(gl, program) {
    const quadVertices = new Float32Array([
        -1, -1,  0, 1,   // 左下角
        1,  -1,  1, 1 ,     // 右下角
        -1,  1,  0, 0,   // 左上角

        -1,  1,  0, 0,   // 左上角
        1,  -1,  1, 1,   // 右下角
        1,   1,  1, 0,   // 右上角
    ]);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
    
    const stride = 4 * 4;
    gl.enableVertexAttribArray(program.locations.a_position);
    gl.vertexAttribPointer(program.locations.a_position, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(program.locations.a_texCoord);
    gl.vertexAttribPointer(program.locations.a_texCoord, 2, gl.FLOAT, false, stride, 2 * 4);
    
    return vao;
}

function drawTexture(texture) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(program.locations.u_image, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}