/**
 * gl/shader.js - 着色器源码管理
 */

// 顶点着色器：标准的正交矩阵变换，将 2D 坐标映射到 NDC (-1 到 1)
export const vertexShaderSource = `#version 300 es
    in vec2 a_position;
    in vec2 a_texCoord;
    out vec2 v_texCoord;

    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

// 片元着色器：最简单的纹理采样器
// 核心：纹理过滤模式（NEAREST/LINEAR）是在 CPU 端通过 gl.texParameteri 设置的，而不是在这里
export const fragmentShaderSource = `#version 300 es
    precision mediump float;
    
    in vec2 v_texCoord;
    uniform sampler2D u_image;
    out vec4 fragColor;

    void main() {
        fragColor = texture(u_image, v_texCoord);
    }
`;