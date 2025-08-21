/**
 * 高级Canvas绘制工具
 * 专为YIN的艺术星球设计
 */
class CanvasUtils {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.pixelRatio = wx.getSystemInfoSync().pixelRatio || 2;
    this.maxCanvasSize = 4096; // 最大Canvas尺寸限制
  }

  /**
   * 初始化Canvas
   * @param {string} canvasId - Canvas ID
   * @param {object} component - 组件实例
   * @returns {Promise} 初始化Promise
   */
  initCanvas(canvasId, component) {
    return new Promise((resolve, reject) => {
      try {
        const query = wx.createSelectorQuery().in(component);
        query.select(`#${canvasId}`)
          .fields({ node: true, size: true })
          .exec((res) => {
            if (res && res[0] && res[0].node) {
              this.canvas = res[0].node;
              this.ctx = this.canvas.getContext('2d');
              
              // 设置Canvas样式
              this.setupCanvasStyle();
              
              console.log('Canvas初始化成功');
              resolve(this.canvas);
            } else {
              // 降级到旧版API
              this.initLegacyCanvas(canvasId, component)
                .then(resolve)
                .catch(reject);
            }
          });
      } catch (error) {
        console.error('Canvas初始化失败:', error);
        reject(error);
      }
    });
  }

  /**
   * 初始化旧版Canvas（兼容性处理）
   * @param {string} canvasId - Canvas ID
   * @param {object} component - 组件实例
   * @returns {Promise} 初始化Promise
   */
  initLegacyCanvas(canvasId, component) {
    return new Promise((resolve, reject) => {
      try {
        this.ctx = wx.createCanvasContext(canvasId, component);
        this.isLegacyCanvas = true;
        console.log('使用旧版Canvas API');
        resolve(this.ctx);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 设置Canvas样式
   */
  setupCanvasStyle() {
    if (!this.ctx) return;
    
    // 设置文本基线
    this.ctx.textBaseline = 'top';
    
    // 设置抗锯齿
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /**
   * 设置Canvas尺寸
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} pixelRatio - 像素比
   */
  setCanvasSize(width, height, pixelRatio = null) {
    if (!this.canvas && !this.isLegacyCanvas) {
      console.error('Canvas未初始化');
      return;
    }

    const ratio = pixelRatio || this.pixelRatio;
    
    // 限制Canvas最大尺寸
    const maxWidth = Math.min(width * ratio, this.maxCanvasSize);
    const maxHeight = Math.min(height * ratio, this.maxCanvasSize);
    
    if (this.canvas) {
      this.canvas.width = maxWidth;
      this.canvas.height = maxHeight;
      this.ctx.scale(ratio, ratio);
    }
    
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.actualWidth = maxWidth;
    this.actualHeight = maxHeight;
    
    console.log(`Canvas尺寸设置: ${width}x${height}, 实际: ${maxWidth}x${maxHeight}`);
  }

  /**
   * 绘制渐变背景
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {string|object} background - 背景色或渐变配置
   */
  drawGradientBackground(width, height, background) {
    if (!this.ctx) return;

    if (typeof background === 'string') {
      // 纯色背景
      this.ctx.fillStyle = background;
      this.ctx.fillRect(0, 0, width, height);
    } else if (background && background.type === 'gradient') {
      // 渐变背景
      const gradient = this.createGradient(background, width, height);
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, width, height);
    } else {
      // 默认白色背景
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(0, 0, width, height);
    }
  }

  /**
   * 创建渐变
   * @param {object} config - 渐变配置
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @returns {CanvasGradient} 渐变对象
   */
  createGradient(config, width, height) {
    let gradient;
    
    switch (config.direction) {
      case 'horizontal':
        gradient = this.ctx.createLinearGradient(0, 0, width, 0);
        break;
      case 'vertical':
        gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        break;
      case 'diagonal':
        gradient = this.ctx.createLinearGradient(0, 0, width, height);
        break;
      case 'radial':
        gradient = this.ctx.createRadialGradient(
          width / 2, height / 2, 0,
          width / 2, height / 2, Math.max(width, height) / 2
        );
        break;
      default:
        gradient = this.ctx.createLinearGradient(0, 0, width, height);
    }
    
    config.colors.forEach((color, index) => {
      const stop = index / (config.colors.length - 1);
      gradient.addColorStop(stop, color);
    });
    
    return gradient;
  }

  /**
   * 绘制文本
   * @param {string} text - 文本内容
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {object} options - 绘制选项
   */
  drawText(text, x, y, options = {}) {
    if (!this.ctx || !text) return;

    const {
      fontSize = 16,
      fontFamily = 'PingFang SC, Microsoft YaHei, sans-serif',
      fontWeight = 'normal',
      color = '#333333',
      maxWidth = null,
      lineHeight = 1.6,
      align = 'left',
      baseline = 'top',
      letterSpacing = 0,
      shadow = null
    } = options;

    // 设置字体
    this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;

    // 设置阴影
    if (shadow) {
      this.ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.3)';
      this.ctx.shadowBlur = shadow.blur || 4;
      this.ctx.shadowOffsetX = shadow.offsetX || 2;
      this.ctx.shadowOffsetY = shadow.offsetY || 2;
    }

    if (maxWidth && maxWidth > 0) {
      this.drawWrappedText(text, x, y, maxWidth, fontSize * lineHeight, letterSpacing);
    } else {
      this.drawSingleLineText(text, x, y, letterSpacing);
    }

    // 清除阴影
    if (shadow) {
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
    }
  }

  /**
   * 绘制单行文本
   * @param {string} text - 文本
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} letterSpacing - 字符间距
   */
  drawSingleLineText(text, x, y, letterSpacing = 0) {
    if (letterSpacing === 0) {
      this.ctx.fillText(text, x, y);
    } else {
      // 手动处理字符间距
      let currentX = x;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        this.ctx.fillText(char, currentX, y);
        const charWidth = this.ctx.measureText(char).width;
        currentX += charWidth + letterSpacing;
      }
    }
  }

  /**
   * 绘制换行文本
   * @param {string} text - 文本内容
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} maxWidth - 最大宽度
   * @param {number} lineHeight - 行高
   * @param {number} letterSpacing - 字符间距
   */
  drawWrappedText(text, x, y, maxWidth, lineHeight, letterSpacing = 0) {
    const lines = text.split('\n');
    let currentY = y;

    lines.forEach(line => {
      if (line.trim() === '') {
        currentY += lineHeight * 0.6; // 空行高度
        return;
      }

      const wrappedLines = this.wrapTextLine(line, maxWidth, letterSpacing);
      wrappedLines.forEach(wrappedLine => {
        this.drawSingleLineText(wrappedLine, x, currentY, letterSpacing);
        currentY += lineHeight;
      });
    });
  }

  /**
   * 文本换行处理
   * @param {string} text - 单行文本
   * @param {number} maxWidth - 最大宽度
   * @param {number} letterSpacing - 字符间距
   * @returns {array} 换行后的文本数组
   */
  wrapTextLine(text, maxWidth, letterSpacing = 0) {
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const testLine = currentLine + char;
      const testWidth = this.measureTextWidth(testLine, letterSpacing);
      
      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine !== '') {
      lines.push(currentLine);
    }
    
    return lines;
  }

  /**
   * 测量文本宽度
   * @param {string} text - 文本
   * @param {number} letterSpacing - 字符间距
   * @returns {number} 文本宽度
   */
  measureTextWidth(text, letterSpacing = 0) {
    if (letterSpacing === 0) {
      return this.ctx.measureText(text).width;
    }
    
    let totalWidth = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charWidth = this.ctx.measureText(char).width;
      totalWidth += charWidth;
      if (i < text.length - 1) {
        totalWidth += letterSpacing;
      }
    }
    return totalWidth;
  }

  /**
   * 导出图片
   * @param {string} format - 图片格式
   * @param {number} quality - 图片质量
   * @returns {Promise} 导出Promise
   */
  exportImage(format = 'png', quality = 1) {
    return new Promise((resolve, reject) => {
      try {
        const exportOptions = {
          fileType: format,
          quality: Math.min(Math.max(quality, 0.1), 1),
          success: (res) => {
            console.log('图片导出成功:', res.tempFilePath);
            resolve(res);
          },
          fail: (error) => {
            console.error('图片导出失败:', error);
            reject(error);
          }
        };

        if (this.canvas) {
          // 新版API
          exportOptions.canvas = this.canvas;
          exportOptions.destWidth = this.actualWidth;
          exportOptions.destHeight = this.actualHeight;
          wx.canvasToTempFilePath(exportOptions);
        } else if (this.isLegacyCanvas) {
          // 旧版API
          exportOptions.canvasId = 'imageCanvas';
          wx.canvasToTempFilePath(exportOptions);
        } else {
          reject(new Error('Canvas未正确初始化'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 清空Canvas
   */
  clear() {
    if (!this.ctx) return;
    
    if (this.canvas) {
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    } else if (this.isLegacyCanvas) {
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.ctx.draw();
    }
  }

  /**
   * 获取Canvas信息
   * @returns {object} Canvas信息
   */
  getCanvasInfo() {
    return {
      width: this.canvasWidth,
      height: this.canvasHeight,
      actualWidth: this.actualWidth,
      actualHeight: this.actualHeight,
      pixelRatio: this.pixelRatio,
      isLegacy: this.isLegacyCanvas,
      maxSize: this.maxCanvasSize
    };
  }
}

module.exports = CanvasUtils;
