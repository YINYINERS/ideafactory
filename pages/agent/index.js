Page({
  data: {
    messages: [
      {
        id: "1",
        type: "ai",
        content: "A User Experience audit is a systematic examination of the user experience provided by a product or service, aimed at identifying strengths and weaknesses, as well as determining areas for improvement.",
        timestamp: Date.now()
      }
    ],
    inputText: "",
    isTyping: false,
    scrollTop: 0
  },

  onLoad() {
    this.scrollToBottom();
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value });
  },

  sendMessage() {
    const content = this.data.inputText.trim();
    if (!content || this.data.isTyping) return;

    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: content,
      timestamp: Date.now()
    };

    this.setData({
      messages: [...this.data.messages, userMessage],
      inputText: "",
      isTyping: true
    });

    this.scrollToBottom();

    // 模拟AI回复
    setTimeout(() => {
      const responses = [
        "Audience Research:\n• Analysis of user profiles\n• Study of behavioral patterns",
        "UI Evaluation:\n• Design analysis\n• Visual harmony assessment",
        "The audit includes research, analysis and recommendations"
      ];
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: Date.now()
      };

      this.setData({
        messages: [...this.data.messages, aiMessage],
        isTyping: false
      });

      this.scrollToBottom();
    }, 1500);
  },

  onCopy(e) {
    const content = e.currentTarget.dataset.content;
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({
        scrollTop: 999999
      });
    }, 100);
  },

  onBack() {
    wx.navigateBack();
  },

  onMenu() {
    wx.showActionSheet({
      itemList: ["新对话", "清除记录", "设置"],
      success: (res) => {
        if (res.tapIndex === 1) {
          this.clearMessages();
        }
      }
    });
  },

  clearMessages() {
    this.setData({
      messages: [{
        id: "1",
        type: "ai",
        content: "你好！我是你的UX审计助手，有什么可以帮您？",
        timestamp: Date.now()
      }]
    });
    this.scrollToBottom();
  },

  onScrollToLower() {
    // 加载更多历史消息逻辑
  }
});