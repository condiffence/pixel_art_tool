/**
 * gl/program.js - Shader 编译与 Program 管理
 */
import { vertexShaderSource, fragmentShaderSource } from './shader.js';

export class ShaderProgram {
    constructor(gl) {
        this.gl = gl;
        this.program = this._createProgram();
        
        // 缓存 Attribute 和 Uniform 位置，避免每帧重复查询
        this.locations = {
            a_position: gl.getAttribLocation(this.program, 'a_position'),
            a_texCoord: gl.getAttribLocation(this.program, 'a_texCoord'),
            u_image: gl.getUniformLocation(this.program, 'u_image')
        };
    }

    _compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Shader compile error: ${info}`);
        }
        return shader;
    }

    _createProgram() {
        const gl = this.gl;
        const vs = this._compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fs = this._compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
        }
        
        // 链接成功后可以删除 shader 对象
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        return program;
    }

    use() {
        this.gl.useProgram(this.program);
    }
}   