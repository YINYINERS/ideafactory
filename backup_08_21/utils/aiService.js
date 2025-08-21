// utils/aiService.js
const SERVER_BASE = 'https://ideafactory.site'; // 修改为你的服务器地址

class AIService {
  // 通过你的后端调用Coze
  async sendMessage(message, conversationId = null) {
    console.log('通过后端调用Coze API:', message);
        
    return new Promise((resolve, reject) => {
      const requestData = {
        message: message,
        user_id: conversationId || 'user_' + Date.now()
      };

      console.log('发送到后端的数据:', requestData);

      wx.request({
        url: `${SERVER_BASE}/api/coze/chat`, // 修改为正确的接口路径
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: requestData,
        timeout: 30000,
        success: (res) => {
          console.log('后端API响应:', res);
          if (res.statusCode === 200 && res.data.success) {
            // 解析AI回复
            const aiMessage = res.data.data?.messages?.[0]?.content || '抱歉，我没有理解您的问题';
            resolve({
              success: true,
              message: aiMessage,
              data: res.data
            });
          } else {
            console.error('后端API错误:', res);
            reject(new Error(res.data?.error || `HTTP ${res.statusCode}: 服务器请求失败`));
          }
        },
        fail: (error) => {
          console.error('后端API请求失败:', error);
          reject(new Error(error.errMsg || '网络请求失败'));
        }
      });
    });
  }

  // 测试服务器连接
  async testConnection() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${SERVER_BASE}/api/test`,
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error('服务器连接失败'));
          }
        },
        fail: reject
      });
    });
  }

  // 其他可能需要的API调用
  async sendToServer(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = SERVER_BASE + endpoint;
            
      wx.request({
        url: url,
        method: method,
        data: data,
        header: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 90000,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.data?.message || '请求失败'}`));
          }
        },
        fail: (error) => {
          console.error('请求服务器失败:', error);
          reject(new Error(error.errMsg || '网络请求失败'));
        }
      });
    });
  }

  generateConversationId() {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

const aiService = new AIService();
module.exports = aiService;