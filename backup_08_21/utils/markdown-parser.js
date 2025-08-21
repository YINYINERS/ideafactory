/**
 * 高级Markdown解析器
 * 专为YIN的艺术星球设计
 */
class MarkdownParser {
  constructor() {
    this.rules = [
      // 标题处理 - 保留层级信息
      { 
        pattern: /^#{6}\s+(.*$)/gim, 
        replacement: '$1', 
        type: 'h6',
        style: { fontSize: 1.0, fontWeight: 'normal', marginBottom: 0.5 }
      },
      { 
        pattern: /^#{5}\s+(.*$)/gim, 
        replacement: '$1', 
        type: 'h5',
        style: { fontSize: 1.1, fontWeight: '500', marginBottom: 0.6 }
      },
      { 
        pattern: /^#{4}\s+(.*$)/gim, 
        replacement: '$1', 
        type: 'h4',
        style: { fontSize: 1.2, fontWeight: '600', marginBottom: 0.7 }
      },
      { 
        pattern: /^#{3}\s+(.*$)/gim, 
        replacement: '$1', 
        type: 'h3',
        style: { fontSize: 1.3, fontWeight: '600', marginBottom: 0.8 }
      },
      { 
        pattern: /^#{2}\s+(.*$)/gim, 
        replacement: '$1', 
        type: 'h2',
        style: { fontSize: 1.5, fontWeight: '700', marginBottom: 1.0 }
      },
      { 
        pattern: /^#{1}\s+(.*$)/gim, 
        replacement: '$1', 
        type: 'h1',
        style: { fontSize: 1.8, fontWeight: '800', marginBottom: 1.2 }
      },
      
      // 文本样式处理
      { 
        pattern: /\*\*\*(.*?)\*\*\*/g, 
        replacement: '$1', 
        type: 'bold-italic',
        style: { fontWeight: 'bold', fontStyle: 'italic' }
      },
      { 
        pattern: /\*\*(.*?)\*\*/g, 
        replacement: '$1', 
        type: 'bold',
        style: { fontWeight: 'bold' }
      },
      { 
        pattern: /\*(.*?)\*/g, 
        replacement: '$1', 
        type: 'italic',
        style: { fontStyle: 'italic' }
      },
      { 
        pattern: /~~(.*?)~~/g, 
        replacement: '$1', 
        type: 'strikethrough',
        style: { textDecoration: 'line-through' }
      },
      
      // 代码处理
      { 
        pattern: /```[\s\S]*?```/g, 
        replacement: (match) => {
          return match.replace(/```/g, '').trim();
        }, 
        type: 'code-block',
        style: { fontFamily: 'monospace', background: '#f5f5f5', padding: '8px' }
      },
      { 
        pattern: /`(.*?)`/g, 
        replacement: '$1', 
        type: 'inline-code',
        style: { fontFamily: 'monospace', background: '#f0f0f0' }
      },
      
      // 链接处理
      { 
        pattern: /\[([^\]]+)\]\(([^)]+)\)/g, 
        replacement: '$1', 
        type: 'link',
        style: { color: '#007AFF', textDecoration: 'underline' }
      },
      
      // 列表处理
      { 
        pattern: /^\s*[-*+]\s+(.*$)/gim, 
        replacement: '• $1', 
        type: 'unordered-list',
        style: { marginLeft: '16px' }
      },
      { 
        pattern: /^\s*\d+\.\s+(.*$)/gim, 
        replacement: '$1', 
        type: 'ordered-list',
        style: { marginLeft: '16px' }
      },
      
      // 引用处理
      { 
        pattern: /^>\s+(.*$)/gim, 
        replacement: '$1', 
        type: 'blockquote',
        style: { 
          borderLeft: '4px solid #ddd', 
          paddingLeft: '16px', 
          fontStyle: 'italic',
          color: '#666'
        }
      },
      
      // 分隔线
      { 
        pattern: /^[-*_]{3,}$/gim, 
        replacement: '────────────────', 
        type: 'hr',
        style: { textAlign: 'center', color: '#ddd' }
      }
    ];
  }

  /**
   * 解析Markdown文本
   * @param {string} markdown - 原始Markdown文本
   * @returns {object} 解析结果
   */
  parse(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return {
        plainText: '',
        structuredContent: [],
        metadata: {
          wordCount: 0,
          lineCount: 0,
          estimatedReadTime: 0
        }
      };
    }

    let plainText = markdown;
    const structuredContent = [];
    
    // 应用所有规则
    this.rules.forEach(rule => {
      if (typeof rule.replacement === 'function') {
        plainText = plainText.replace(rule.pattern, rule.replacement);
      } else {
        plainText = plainText.replace(rule.pattern, rule.replacement);
      }
    });
    
    // 清理多余的空行
    plainText = this.cleanupText(plainText);
    
    // 生成元数据
    const metadata = this.generateMetadata(plainText);
    
    return {
      plainText,
      structuredContent,
      metadata
    };
  }

  /**
   * 提取纯文本（去除所有Markdown标记）
   * @param {string} markdown - Markdown文本
   * @returns {string} 纯文本
   */
  extractPlainText(markdown) {
    if (!markdown) return '';
    
    let text = markdown;
    
    // 按顺序移除Markdown语法
    text = text.replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```/g, '').trim();
    }); // 代码块
    
    text = text.replace(/#{1,6}\s+/g, ''); // 标题
    text = text.replace(/\*\*\*(.*?)\*\*\*/g, '$1'); // 粗斜体
    text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // 粗体
    text = text.replace(/\*(.*?)\*/g, '$1'); // 斜体
    text = text.replace(/~~(.*?)~~/g, '$1'); // 删除线
    text = text.replace(/`(.*?)`/g, '$1'); // 行内代码
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // 链接
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1'); // 图片
    text = text.replace(/^\s*[-*+]\s+/gm, '• '); // 无序列表
    text = text.replace(/^\s*\d+\.\s+/gm, ''); // 有序列表
    text = text.replace(/^>\s+/gm, ''); // 引用
    text = text.replace(/^[-*_]{3,}$/gm, '────────────────'); // 分隔线
    
    // 清理文本
    return this.cleanupText(text);
  }

  /**
   * 清理文本
   * @param {string} text - 待清理的文本
   * @returns {string} 清理后的文本
   */
  cleanupText(text) {
    return text
      .replace(/\n{3,}/g, '\n\n') // 合并多个空行
      .replace(/^\s+|\s+$/g, '') // 去除首尾空白
      .replace(/[ \t]+/g, ' '); // 合并多个空格
  }

  /**
   * 生成文档元数据
   * @param {string} text - 文本内容
   * @returns {object} 元数据
   */
  generateMetadata(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // 估算阅读时间（中文按字符计算，英文按单词计算）
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = words.filter(word => /^[a-zA-Z]+$/.test(word)).length;
    
    // 中文阅读速度约300字/分钟，英文约200词/分钟
    const estimatedReadTime = Math.ceil(
      (chineseChars / 300 + englishWords / 200) || 0.5
    );
    
    return {
      wordCount: words.length,
      characterCount: text.length,
      chineseCharCount: chineseChars,
      lineCount: lines.length,
      estimatedReadTime,
      isEmpty: text.trim().length === 0
    };
  }

  /**
   * 检测文档类型
   * @param {string} markdown - Markdown文本
   * @returns {string} 文档类型
   */
  detectDocumentType(markdown) {
    if (!markdown) return 'empty';
    
    const hasHeaders = /^#{1,6}\s+/m.test(markdown);
    const hasLists = /^\s*[-*+\d+\.]\s+/m.test(markdown);
    const hasCode = /```[\s\S]*?```|`.*?`/.test(markdown);
    const hasLinks = /\[.*?\]\(.*?\)/.test(markdown);
    const hasQuotes = /^>\s+/m.test(markdown);
    
    if (hasCode && hasHeaders) return 'technical';
    if (hasLists && hasHeaders) return 'structured';
    if (hasQuotes) return 'article';
    if (hasHeaders) return 'document';
    return 'plain';
  }

  /**
   * 获取文档大纲
   * @param {string} markdown - Markdown文本
   * @returns {array} 大纲数组
   */
  getOutline(markdown) {
    if (!markdown) return [];
    
    const outline = [];
    const headerRegex = /^(#{1,6})\s+(.*)$/gm;
    let match;
    
    while ((match = headerRegex.exec(markdown)) !== null) {
      outline.push({
        level: match[1].length,
        title: match[2].trim(),
        anchor: this.generateAnchor(match[2])
      });
    }
    
    return outline;
  }

  /**
   * 生成锚点
   * @param {string} title - 标题文本
   * @returns {string} 锚点字符串
   */
  generateAnchor(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * 验证Markdown语法
   * @param {string} markdown - Markdown文本
   * @returns {object} 验证结果
   */
  validateSyntax(markdown) {
    const errors = [];
    const warnings = [];
    
    if (!markdown) {
      return { isValid: true, errors, warnings };
    }
    
    // 检查未闭合的代码块
    const codeBlocks = markdown.match(/```/g);
    if (codeBlocks && codeBlocks.length % 2 !== 0) {
      errors.push('存在未闭合的代码块');
    }
    
    // 检查未闭合的行内代码
    const inlineCode = markdown.match(/`/g);
    if (inlineCode && inlineCode.length % 2 !== 0) {
      warnings.push('可能存在未闭合的行内代码');
    }
    
    // 检查链接格式
    const invalidLinks = markdown.match(/\[[^\]]*\]\([^)]*$/gm);
    if (invalidLinks) {
      errors.push('存在格式错误的链接');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

module.exports = MarkdownParser;
