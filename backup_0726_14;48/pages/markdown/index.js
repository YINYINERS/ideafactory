Page({
  data: {
    markdownText: '',
    previewText: '',
    generating: false,
    isFullscreen: false,
    
    // 新增：动画相关数据
    animationOrigin: { x: '50%', y: '50%' },
    
    settings: {
      backgroundColor: '#ffffff',
      fontSize: 16,
      padding: 24,
      imageWidth: 750
    },
    
    backgroundColors: [
      '#ffffff', '#f8f9fa', '#f5f5f7', '#e5e5ea',
      '#ffebee', '#e3f2fd', '#e8f5e8', '#fff3e0',
      '#fafafa', '#000000'
    ],
    
    exportFormats: [
      { label: 'PNG图片', value: 'png' },
      { label: 'JPG图片', value: 'jpg' }
    ],
    
    exportFormatIndex: 0,
    canvasWidth: 750,
    canvasHeight: 1000
  },

  onLoad() {
    this.generatePreview();
  },

  onMarkdownInput(e) {
    this.setData({
      markdownText: e.detail.value
    });
    this.generatePreview();
  },

  clearInput() {
    this.setData({
      markdownText: '',
      previewText: ''
    });
  },

  // 修改后的 toggleFullscreen 函数，增加延迟和调试
toggleFullscreen(e) {
  console.log('toggleFullscreen called', { isFullscreen: this.data.isFullscreen, event: e });
  
  if (!this.data.isFullscreen) {
    // 获取点击位置作为动画起始点
    let originX = '50%';
    let originY = '50%';
    
    // 先设置动画起始点
    if (e && e.touches && e.touches[0]) {
      const touch = e.touches[0];
      const systemInfo = wx.getSystemInfoSync();
      originX = (touch.clientX / systemInfo.windowWidth * 100) + '%';
      originY = (touch.clientY / systemInfo.windowHeight * 100) + '%';
      console.log('Using touch position:', { originX, originY });
    } else {
      // 如果无法获取点击位置，使用扩展按钮的位置
      const query = wx.createSelectorQuery();
      query.select('.btn-expand').boundingClientRect();
      query.exec((res) => {
        if (res[0]) {
          const rect = res[0];
          const systemInfo = wx.getSystemInfoSync();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          originX = (centerX / systemInfo.windowWidth * 100) + '%';
          originY = (centerY / systemInfo.windowHeight * 100) + '%';
          console.log('Using button position:', { originX, originY, rect });
        }
        
        // 设置动画起始点
        this.setData({
          animationOrigin: { x: originX, y: originY }
        });
        
        // 延迟一帧再开启全屏，确保CSS变量已更新
        wx.nextTick(() => {
          this.setData({
            isFullscreen: true
          });
        });
      });
      return;
    }
    
    // 设置动画起始点
    this.setData({
      animationOrigin: { x: originX, y: originY }
    });
    
    // 延迟一帧再开启全屏
    wx.nextTick(() => {
      this.setData({
        isFullscreen: true
      });
    });
    
  } else {
    // 关闭全屏
    this.setData({
      isFullscreen: false
    });
  }
},

  // 修改后的parseMarkdown函数，支持表格转换
  parseMarkdown(text) {
    let result = text;
    
    // 1. 首先处理表格（必须在其他处理之前）
    result = this.parseTable(result);
    
    // 2. 处理代码块
    result = result.replace(/```[\s\S]*?```/g, (match) => {
      const content = match.replace(/```\w*\n?/, '').replace(/```$/, '').trim();
      return '┌─ 代码块 ─┐\n' + content + '\n└─────────┘\n';
    });
    
    // 3. 处理标题
    result = result.replace(/^#{6}\s+(.+)$/gm, '      ▫ $1');
    result = result.replace(/^#{5}\s+(.+)$/gm, '     ▫ $1');
    result = result.replace(/^#{4}\s+(.+)$/gm, '    ▫ $1');
    result = result.replace(/^#{3}\s+(.+)$/gm, '   ▫ $1');
    result = result.replace(/^#{2}\s+(.+)$/gm, '  ▫ $1');
    result = result.replace(/^#{1}\s+(.+)$/gm, ' ▫ $1');
    
    // 4. 处理粗体和斜体
    result = result.replace(/\*\*\*(.*?)\*\*\*/g, '【$1】');
    result = result.replace(/\*\*(.*?)\*\*/g, '【$1】');
    result = result.replace(/\*(.*?)\*/g, '$1');
    result = result.replace(/__(.*?)__/g, '【$1】');
    result = result.replace(/_(.*?)_/g, '$1');
    
    // 5. 处理行内代码
    result = result.replace(/`(.*?)`/g, '[$1]');
    
    // 6. 处理链接和图片
    result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, '[图片: $1]');
    result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // 7. 处理列表
    result = result.replace(/^\s*[-*+]\s+(.+)$/gm, '• $1');
    result = result.replace(/^\s*\d+\.\s+(.+)$/gm, '• $1');
    
    // 8. 处理引用
    result = result.replace(/^>\s*(.+)$/gm, '❝ $1');
    
    // 9. 处理分割线
    result = result.replace(/^[-*_]{3,}$/gm, '─'.repeat(30));
    
    // 10. 处理删除线
    result = result.replace(/~~(.*?)~~/g, '$1');
    
    // 11. 清理多余的空行
    result = result.replace(/\n{3,}/g, '\n\n');
    
    return result.trim();
  },

  // 修复后的表格处理函数
  parseTable(text) {
    const tableRegex = /(?:^\|.+\|[ \t]*$\n?)+/gm;
    
    return text.replace(tableRegex, (match) => {
      const lines = match.trim().split('\n');
      const tableData = [];
      let headers = [];
      let foundHeader = false;
      
      // 解析表格行
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 跳过空行
        if (!line) continue;
        
        // 检测并跳过分隔行（表头分隔符）
        if (this.isTableSeparatorLine(line)) {
          foundHeader = true;
          continue;
        }
        
        // 解析数据行
        if (line.startsWith('|') && line.endsWith('|')) {
          const cells = line.slice(1, -1).split('|').map(cell => {
            return cell.trim()
                      .replace(/\*\*(.*?)\*\*/g, '$1')
                      .replace(/\*(.*?)\*/g, '$1')
                      .replace(/`(.*?)`/g, '$1')
                      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
          });
          
          // 验证是否为有效的数据行（不能全是空白或分隔符）
          if (this.isValidTableRow(cells)) {
            if (headers.length === 0) {
              // 第一行作为表头
              headers = cells;
            } else {
              // 数据行
              tableData.push(cells);
            }
          }
        }
      }
      
      // 如果没有找到有效的表头和数据，返回空字符串
      if (headers.length === 0 || tableData.length === 0) {
        return '';
      }
      
      // 生成逐行展示格式
      let result = '';
      
      tableData.forEach((row, rowIndex) => {
        if (rowIndex > 0) {
          result += '\n'; // 行与行之间空一行
        }
        
        for (let i = 0; i < headers.length && i < row.length; i++) {
          const header = headers[i] || `列${i + 1}`;
          const cellData = row[i] || '';
          
          // 只有当表头或数据不为空时才输出
          if (header.trim() && (cellData.trim() || i < headers.length)) {
            result += `${i + 1}、${header}：${cellData}\n`;
          }
        }
      });
      
      return result + '\n';
    });
  },

  // 新增：检测是否为表格分隔行
  isTableSeparatorLine(line) {
    // 移除首尾的 | 符号
    const content = line.replace(/^\||\|$/g, '').trim();
    
    // 分割成单元格
    const cells = content.split('|');
    
    // 检查每个单元格是否只包含 -、:、空格
    return cells.every(cell => {
      const trimmed = cell.trim();
      return /^[-:\s]*$/.test(trimmed) && trimmed.length > 0;
    });
  },

  // 新增：验证是否为有效的表格数据行
  isValidTableRow(cells) {
    // 过滤掉全是空白的行
    const nonEmptyCells = cells.filter(cell => cell.trim().length > 0);
    if (nonEmptyCells.length === 0) {
      return false;
    }
    
    // 过滤掉全是分隔符的行
    const hasValidContent = cells.some(cell => {
      const trimmed = cell.trim();
      return trimmed.length > 0 && !/^[-:\s]*$/.test(trimmed);
    });
    
    return hasValidContent;
  },

  // 计算字符显示宽度
  getDisplayWidth(str) {
    let width = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char.match(/[\u4e00-\u9fff\uff00-\uffef]/)) {
        width += 2;
      } else {
        width += 1;
      }
    }
    return width;
  },

  calculateTextHeight(text, width, fontSize, padding) {
    const lines = text.split('\n');
    let totalHeight = padding * 2;
    const lineHeight = fontSize * 1.6;
    const maxWidth = width - padding * 2;
    
    lines.forEach(line => {
      if (line.trim() === '') {
        totalHeight += lineHeight * 0.6;
      } else {
        const charWidth = fontSize * 0.55;
        const charsPerLine = Math.floor(maxWidth / charWidth);
        const lineCount = Math.max(1, Math.ceil(line.length / charsPerLine));
        totalHeight += lineCount * lineHeight;
      }
    });
    
    return Math.max(totalHeight, 300);
  },

  generatePreview() {
    if (!this.data.markdownText || this.data.markdownText.trim() === '') {
      this.setData({ previewText: '' });
      return;
    }
    
    const previewText = this.parseMarkdown(this.data.markdownText);
    this.setData({ previewText });
  },

  onBackgroundColorChange(e) {
    this.setData({
      'settings.backgroundColor': e.currentTarget.dataset.color
    });
    this.generatePreview();
  },

  onFontSizeChange(e) {
    this.setData({
      'settings.fontSize': e.detail.value
    });
    this.generatePreview();
  },

  onPaddingChange(e) {
    this.setData({
      'settings.padding': e.detail.value
    });
    this.generatePreview();
  },

  onExportFormatChange(e) {
    this.setData({
      exportFormatIndex: e.detail.value
    });
  },

  generateImage() {
    if (!this.data.markdownText || this.data.markdownText.trim() === '') {
      wx.showToast({
        title: '请输入文本',
        icon: 'none'
      });
      return;
    }

    this.setData({ generating: true });

    try {
      const text = this.parseMarkdown(this.data.markdownText);
      const width = this.data.settings.imageWidth;
      const height = this.calculateTextHeight(text, width, this.data.settings.fontSize, this.data.settings.padding);

      this.setData({
        canvasWidth: width,
        canvasHeight: height
      });

      setTimeout(() => {
        this.drawCanvas(text, width, height);
      }, 100);

    } catch (error) {
      console.error('生成图片失败:', error);
      wx.showToast({
        title: '生成失败',
        icon: 'none'
      });
      this.setData({ generating: false });
    }
  },

  drawCanvas(text, width, height) {
    const ctx = wx.createCanvasContext('imageCanvas', this);
    
    // 绘制背景
    ctx.setFillStyle(this.data.settings.backgroundColor);
    ctx.fillRect(0, 0, width, height);
    
    // 修改文字颜色逻辑 - 只有黑色背景用白字，其他都用黑字
    const textColor = this.data.settings.backgroundColor === '#000000' ? '#ffffff' : '#1c1c1e';
    ctx.setFillStyle(textColor);
    ctx.setFontSize(this.data.settings.fontSize);
    
    this.drawWrappedText(ctx, text, this.data.settings.padding, this.data.settings.padding + this.data.settings.fontSize, width - this.data.settings.padding * 2, this.data.settings.fontSize * 1.6);
    
    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: 'imageCanvas',
          destWidth: width * 6,
          destHeight: height * 6,
          fileType: this.data.exportFormats[this.data.exportFormatIndex].value,
          quality: 1,
          success: (res) => {
            this.saveImage(res.tempFilePath);
          },
          fail: (err) => {
            console.error('导出失败:', err);
            wx.showToast({
              title: '导出失败',
              icon: 'none'
            });
            this.setData({ generating: false });
          }
        }, this);
      }, 500);
    });
  },

  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const lines = text.split('\n');
    let currentY = y;
    
    lines.forEach(line => {
      if (line.trim() === '') {
        currentY += lineHeight * 0.6;
        return;
      }
      
      const words = line.split('');
      let currentLine = '';
      
      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i];
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine !== '') {
          ctx.fillText(currentLine, x, currentY);
          currentLine = words[i];
          currentY += lineHeight;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine !== '') {
        ctx.fillText(currentLine, x, currentY);
        currentY += lineHeight;
      }
    });
  },

  saveImage(filePath) {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.writePhotosAlbum']) {
          this.doSaveImage(filePath);
        } else {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.doSaveImage(filePath);
            },
            fail: () => {
              wx.showModal({
                title: '提示',
                content: '需要授权保存图片到相册',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting();
                  }
                }
              });
              this.setData({ generating: false });
            }
          });
        }
      }
    });
  },

  doSaveImage(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('保存失败:', err);
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ generating: false });
      }
    });
  }
});