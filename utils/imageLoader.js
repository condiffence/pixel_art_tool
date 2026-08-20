/**
 * utils/imageLoader.js - 图片加载与跨域处理
 */

/**
 * 从 File 对象加载图片并返回 Promise
 * @param {File} file - 用户选择的图片文件
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('请选择有效的图片文件'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = e.target.result; // 使用 Base64 DataURL，天然避免跨域污染
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
    });
}

/**
 * 从 URL 加载图片并返回 Promise
 * 自动处理跨域属性，确保 WebGL 可以读取像素
 * @param {string} url - 图片链接
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // 关键：设置跨域属性
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('网络图片加载失败'));
        img.src = url;
    });
}