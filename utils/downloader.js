/**
 * utils/downloader.js - 文件导出与下载
 */

/**
 * 将 Canvas 导出为图片并触发下载
 * @param {HTMLCanvasElement} canvas - 目标 Canvas 元素
 * @param {string} [filename='pixelated-image.png'] - 下载的文件名
 * @param {string} [mimeType='image/png'] - 导出的 MIME 类型
 * @param {number} [quality=0.9] - 图片质量 (仅对 image/jpeg 有效)
 * @returns {Promise<void>}
 */
export function downloadCanvas(canvas, filename = 'pixelated-image.png', mimeType = 'image/png', quality = 0.9) {
    return new Promise((resolve, reject) => {
        if (!canvas) {
            reject(new Error('Canvas 元素不存在'));
            return;
        }

        // 检查 Canvas 是否被跨域污染
        try {
            // 尝试读取一个像素，如果跨域污染会抛出异常
            canvas.getContext('2d').getImageData(0, 0, 1, 1);
        } catch (err) {
            reject(new Error('Canvas 被跨域污染，无法导出。请确保图片同源或服务器允许 CORS'));
            return;
        }

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas 导出 Blob 失败'));
                    return;
                }

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                
                // 清理 DOM 和内存
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                resolve();
            },
            mimeType,
            quality
        );
    });
}