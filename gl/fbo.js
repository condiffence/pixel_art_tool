/**
 * gl/fbo.js - 帧缓冲对象 (Framebuffer Object) 管理
 */
export class Framebuffer {
    constructor(gl) {
        this.gl = gl;
        this.fbo = gl.createFramebuffer();
        this.texture = gl.createTexture();
        this.width = 0;
        this.height = 0;
    }

    /**
     * 调整 FBO 尺寸
     * @param {number} width - 目标宽度（即像素块的列数）
     * @param {number} height - 目标高度（即像素块的行数）
     */
    resize(width, height) {
        const gl = this.gl;
        this.width = width;
        this.height = height;

        // 绑定纹理并分配显存
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        
        // ⚠️ 核心：关闭线性过滤，使用最近邻采样，
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // 绑定 FBO 并将纹理附加到颜色附件
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
        
        // 检查 FBO 状态
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('Framebuffer is not complete!');
        }
        
        // 解绑
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    bind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
        this.gl.viewport(0, 0, this.width, this.height);
    }

    unbind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    destroy() {
        const gl = this.gl;
        gl.deleteFramebuffer(this.fbo);
        gl.deleteTexture(this.texture);
    }
}