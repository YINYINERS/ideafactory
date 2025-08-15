// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化服务器配置
    this.globalData.serverBase = 'http://122.51.127.227:3000'; // 使用你的服务器IP和端口
    
    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到你的服务器换取 openId
        if (res.code) {
          wx.request({
            url: this.globalData.serverBase + '/api/auth/login',
            method: 'POST',
            data: { code: res.code },
            success: (res) => {
              if (res.data.success) {
                this.globalData.userInfo = res.data.userInfo;
                this.globalData.token = res.data.token;
              }
            }
          });
        }
      }
    });
  },
  
  globalData: {
    userInfo: null,
    token: null,
    serverBase: '', // 服务器地址
    aiService: require('./utils/aiService') // AI服务
  }
});