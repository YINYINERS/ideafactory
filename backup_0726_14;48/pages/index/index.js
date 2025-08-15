Page({
  data: {
    currentDate: '',
    leftCards: [
      {
        id: 1,
        title: 'Markdown编辑器',
        description: '强大的Markdown编辑器，支持实时预览、语法高亮、导出等功能',
        iconSrc: '/images/markdown-icon.png',
        iconClass: 'icon-markdown',
        className: 'card-large',
        url: '/pages/markdown/index',
        showStatus: false
      },
      {
        id: 3,
        title: '图片处理工具',
        description: '在线图片编辑工具，支持裁剪、滤镜、压缩等功能',
        iconSrc: '/images/image-icon.png',
        iconClass: 'icon-picture',
        className: 'card-large',
        url: '',
        showStatus: true
      },
      {
        id: 5,
        title: '代码格式化',
        description: '支持多种编程语言的代码格式化和美化工具',
        iconSrc: '/images/code-icon.png',
        iconClass: 'icon-code',
        className: 'card-medium',
        url: '',
        showStatus: true
      },
      {
        id: 7,
        title: 'AI助手',
        description: '智能AI助手，帮助你解决各种问题',
        iconSrc: '/images/ai-icon.png',
        iconClass: 'icon-ai',
        className: 'card-large',
        url: '',
        showStatus: true
      }
    ],
    rightCards: [
      {
        id: 2,
        title: '调色板工具',
        description: '专业的颜色搭配工具，帮你找到完美的色彩组合',
        iconSrc: '/images/color-icon.png',
        iconClass: 'icon-color',
        className: 'card-medium',
        url: '',
        showStatus: true
      },
      {
        id: 4,
        title: '文本工具集',
        description: '文本处理工具集合，包含格式转换、字数统计等实用功能',
        iconSrc: '/images/text-icon.png',
        iconClass: 'icon-text',
        className: 'card-large',
        url: '',
        showStatus: true
      },
      {
        id: 6,
        title: '设计灵感库',
        description: '收集和整理设计灵感，创建你的专属创意库',
        iconSrc: '/images/design-icon.png',
        iconClass: 'icon-design',
        className: 'card-large',
        url: '',
        showStatus: true
      },
      {
        id: 8,
        title: '实用工具箱',
        description: '日常实用小工具集合',
        iconSrc: '/images/tool-icon.png',
        iconClass: 'icon-tool',
        className: 'card-large',
        url: '',
        showStatus: true
      }
    ]
  },

  onLoad() {
    this.setCurrentDate();
  },

  setCurrentDate() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();
    
    this.setData({
      currentDate: `${month} ${day}, ${year}`
    });
  },

  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({
        url: url
      });
    } else {
      wx.showToast({
        title: '功能开发中...',
        icon: 'none',
        duration: 2000
      });
    }
  }
});