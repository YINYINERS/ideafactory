const aiService = require('../../utils/aiService');

Page({
  data: {
    messages: [],
    inputText: "",
    isTyping: false,
    scrollTop: 0,
    conversationId: null,
    isOnline: true,
    statusIcon: '/images/plus.png',
    lastActivityTime: Date.now(), // 记录最后活动时间
    offlineTimer: null, // 离线计时器
    // 新增键盘相关状态
    keyboardHeight: 0,
    isKeyboardShow: false,
    inputBarHeight: 0
  },

  onLoad() {
    console.log('页面加载');
    this.generateConversationId();
    this.loadStatusIcon();
    this.initActivityMonitor(); // 初始化活动监控
    // 延迟加载聊天记录，确保页面完全初始化
    setTimeout(() => {
      this.loadChatHistory();
    }, 100);
  },

  onShow() {
    console.log('页面显示');
    this.loadChatHistory();
    this.updateActivity(); // 页面显示时更新活动时间
  },

  onHide() {
    console.log('页面隐藏');
    this.saveChatHistory();
  },

  onUnload() {
    console.log('页面卸载');
    this.saveChatHistory();
    // 清理所有定时器
    if (this.offlineTimer) {
      clearTimeout(this.offlineTimer);
    }
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
  },

  // 初始化活动监控
  initActivityMonitor() {
    this.setData({
      isOnline: true,
      lastActivityTime: Date.now()
    });
    this.startOfflineTimer();
  },

  // 更新用户活动时间
  updateActivity() {
    const now = Date.now();
    this.setData({
      lastActivityTime: now,
      isOnline: true // 有活动时立即设为在线
    });
    
    // 重新开始离线计时器
    this.startOfflineTimer();
  },

  // 开始离线计时器
  startOfflineTimer() {
    // 清除之前的计时器
    if (this.offlineTimer) {
      clearTimeout(this.offlineTimer);
    }
    
    // 20秒后设为离线
    this.offlineTimer = setTimeout(() => {
      this.setData({
        isOnline: false
      });
      console.log('用户20秒无操作，设为离线状态');
    }, 20000); // 20秒
  },

  // 生成对话ID - 修改逻辑，优先使用已存在的ID
  generateConversationId() {
    // 先尝试从存储中获取最近的对话ID
    try {
      const recentConversationId = wx.getStorageSync('recentConversationId');
      if (recentConversationId) {
        this.setData({
          conversationId: recentConversationId
        });
        console.log('使用已存在的会话ID:', recentConversationId);
        return;
      }
    } catch (error) {
      console.error('获取最近对话ID失败:', error);
    }

    // 如果没有已存在的ID，则生成新的
    const conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    this.setData({
      conversationId: conversationId
    });
    
    // 保存为最近的对话ID
    try {
      wx.setStorageSync('recentConversationId', conversationId);
    } catch (error) {
      console.error('保存最近对话ID失败:', error);
    }
    
    console.log('生成新会话ID:', conversationId);
  },

  // 加载保存的图标
  loadStatusIcon() {
    try {
      const savedIcon = wx.getStorageSync('statusIcon');
      if (savedIcon) {
        this.setData({
          statusIcon: savedIcon
        });
      }
    } catch (error) {
      console.error('加载图标失败:', error);
    }
  },

  // 保存聊天记录到本地存储
  saveChatHistory() {
    if (this.data.messages.length > 0 && this.data.conversationId) {
      const chatData = {
        conversationId: this.data.conversationId,
        messages: this.data.messages,
        timestamp: Date.now()
      };
      
      try {
        wx.setStorageSync(`chat_${this.data.conversationId}`, chatData);
        console.log('聊天记录已保存:', this.data.messages.length, '条消息');
      } catch (error) {
        console.error('保存聊天记录失败:', error);
      }
    }
  },

  // 加载聊天记录
  loadChatHistory() {
    if (this.data.conversationId) {
      try {
        const chatData = wx.getStorageSync(`chat_${this.data.conversationId}`);
        if (chatData && chatData.messages && chatData.messages.length > 0) {
          this.setData({
            messages: chatData.messages
          });
          console.log('聊天记录已加载:', chatData.messages.length, '条消息');
          
          // 滚动到底部
          setTimeout(() => {
            this.scrollToBottom();
          }, 200);
        } else {
          console.log('没有找到聊天记录');
        }
      } catch (error) {
        console.error('加载聊天记录失败:', error);
      }
    }
  },

  // 新建对话 - 修改提示文字
  onNewChat() {
    this.updateActivity(); // 更新活动时间
    
    wx.showModal({
      title: '新建对话',
      content: '确定要开始新对话吗？当前对话将不被保存。',
      success: (res) => {
        if (res.confirm) {
          // 先保存当前对话
          this.saveChatHistory();
          
          // 生成新的对话ID
          const newConversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          
          // 更新数据
          this.setData({
            conversationId: newConversationId,
            messages: [],
            inputText: "",
            isTyping: false,
            scrollTop: 0
          });
          
          // 保存新的对话ID为最近对话
          try {
            wx.setStorageSync('recentConversationId', newConversationId);
          } catch (error) {
            console.error('保存新对话ID失败:', error);
          }
          
          console.log('新对话已创建:', newConversationId);
          
          wx.showToast({
            title: '新对话已创建',
            icon: 'success'
          });
        }
      }
    });
  },

  // 配置状态栏图标
  onConfigIcon() {
    this.updateActivity(); // 更新活动时间
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          statusIcon: tempFilePath
        });
        
        wx.setStorageSync('statusIcon', tempFilePath);
        
        wx.showToast({
          title: '图标已更新',
          icon: 'success'
        });
      }
    });
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  onInputChange(e) {
    this.updateActivity(); // 输入时更新活动时间
    
    let value = '';
    if (e && e.detail && typeof e.detail.value !== 'undefined') {
      value = e.detail.value;
    }
    
    this.setData({
      inputText: value
    });
  },

  // 监听键盘高度变化
  onKeyboardHeightChange(e) {
    const keyboardHeight = e.detail.height;
    console.log('键盘高度变化:', keyboardHeight);
    
    this.setData({
      keyboardHeight: keyboardHeight,
      isKeyboardShow: keyboardHeight > 0
    });

    // 键盘弹起时滚动到底部，确保按钮可见
    if (keyboardHeight > 0) {
      setTimeout(() => {
        this.scrollToBottomWithPadding();
      }, 150);
    }
  },

  // 修改输入框聚焦方法
  onInputFocus() {
    this.updateActivity(); // 聚焦时更新活动时间
    
    // 延迟滚动，等待键盘完全弹起，确保按钮可见
    setTimeout(() => {
      this.scrollToBottomWithPadding();
    }, 350);
  },

  // 输入框失去焦点
  onInputBlur() {
    this.updateActivity();
    
    // 键盘收起时重置状态
    setTimeout(() => {
      this.setData({
        keyboardHeight: 0,
        isKeyboardShow: false
      });
    }, 100);
  },

  // 点击页面其他区域收起键盘
  onPageTap() {
    if (this.data.isKeyboardShow) {
      console.log('点击页面其他区域，收起键盘');
      wx.hideKeyboard();
    }
  },

  // 阻止输入区域的点击事件冒泡
  onInputAreaTap(e) {
    e.stopPropagation();
  },

  sendMessage() {
    this.updateActivity(); // 发送消息时更新活动时间
    
    const inputText = this.data.inputText || "";
    const content = inputText.trim();

    if (content.length === 0) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }

    if (this.data.isTyping) {
      wx.showToast({
        title: '正在发送中',
        icon: 'none'
      });
      return;
    }

    // 离线状态下仍然允许发送，但会提示
    if (!this.data.isOnline) {
      wx.showToast({
        title: '当前离线状态，正在尝试发送...',
        icon: 'none'
      });
      // 发送时自动设为在线状态
      this.setData({
        isOnline: true
      });
    }

    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: content,
      timestamp: Date.now()
    };

    const newMessages = [...this.data.messages, userMessage];
    this.setData({
      messages: newMessages,
      inputText: "",
      isTyping: true
    });

    // 实时保存聊天记录
    setTimeout(() => {
      this.saveChatHistory();
    }, 100);
    
    this.scrollToBottomWithPadding();
    this.callBackendAPI(content);
  },

  async callBackendAPI(content) {
    try {
      const response = await aiService.sendMessage(content, this.data.conversationId);
      this.handleBackendResponse(response);
    } catch (error) {
      console.error('后端API调用失败:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: `抱歉，服务暂时不可用。\n\n错误信息：${error.message}\n\n请稍后重试或检查网络连接。`,
        timestamp: Date.now(),
        isError: true
      };

      this.setData({
        messages: [...this.data.messages, errorMessage],
        isTyping: false
      });

      setTimeout(() => {
        this.saveChatHistory();
      }, 100);

      wx.showToast({
        title: '发送失败',
        icon: 'error'
      });
    }

    this.scrollToBottomWithPadding();
  },

  handleBackendResponse(response) {
    let aiContent = "抱歉，我现在无法处理您的请求。";

    if (response) {
      if (response.success && response.data && response.data.reply) {
        aiContent = response.data.reply;
      } else if (response.reply) {
        aiContent = response.reply;
      } else if (response.content) {
        aiContent = response.content;
      } else if (response.message) {
        aiContent = response.message;
      } else if (typeof response === 'string') {
        aiContent = response;
      }
    }

    const aiMessage = {
      id: (Date.now() + 1).toString(),
      type: "ai",
      content: aiContent,
      timestamp: Date.now()
    };

    this.setData({
      messages: [...this.data.messages, aiMessage],
      isTyping: false
    });

    setTimeout(() => {
      this.saveChatHistory();
    }, 100);
    
    this.scrollToBottomWithPadding();
  },

  onCopy(e) {
    this.updateActivity(); // 复制时更新活动时间
    
    const content = e.currentTarget.dataset.content;
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  },

  onRegenerate(e) {
    this.updateActivity(); // 重新生成时更新活动时间
    
    const messageId = e.currentTarget.dataset.messageId;

    if (this.data.isTyping) {
      wx.showToast({
        title: '正在生成中',
        icon: 'none'
      });
      return;
    }

    // 离线状态下仍然允许重新生成
    if (!this.data.isOnline) {
      wx.showToast({
        title: '当前离线状态，正在尝试重新生成...',
        icon: 'none'
      });
      // 操作时自动设为在线状态
      this.setData({
        isOnline: true
      });
    }

    const messages = this.data.messages;
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex === -1) {
      wx.showToast({
        title: '消息不存在',
        icon: 'none'
      });
      return;
    }

    let userMessage = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].type === 'user') {
        userMessage = messages[i];
        break;
      }
    }

    if (!userMessage) {
      wx.showToast({
        title: '找不到原始问题',
        icon: 'none'
      });
      return;
    }

    const newMessages = messages.filter(msg => msg.id !== messageId);
    
    this.setData({
      messages: newMessages,
      isTyping: true
    });

    this.callBackendAPI(userMessage.content);
  },

  // 新增方法：滚动到底部并确保按钮可见
  scrollToBottomWithPadding() {
    setTimeout(() => {
      // 更大的滚动距离，确保AI操作按钮完全可见
      this.setData({
        scrollTop: 999999 + 200
      });
    }, 100);
  },

  // 修改现有的 scrollToBottom 方法
  scrollToBottom() {
    setTimeout(() => {
      // 根据键盘状态调整滚动距离
      const extraHeight = this.data.isKeyboardShow ? 150 : 50;
      this.setData({
        scrollTop: 999999 + extraHeight
      });
    }, 100);
  },

  onScrollToLower() {
    this.updateActivity(); // 滚动时更新活动时间
    console.log('滚动到底部');
  },

  // 页面滚动时也更新活动时间
  onScroll() {
    this.updateActivity();
  }
});