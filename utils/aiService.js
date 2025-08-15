// utils/aiService.js
const COZE_API_BASE = 'https://api.coze.cn/open_api/v2';
const BOT_ID = '7506418948469309492'; // 替换为你的Bot ID
const ACCESS_TOKEN = 'pat_ocIbFZaQJfFBaSo85dOaT8uPGusNwDzT240PtovSTy8cACQkpUWKynNaF8YaCRN7'; // 替换为你的访问令牌

// 新增服务器配置（两种选择）
// 方案1：直接使用IP地址（开发阶段）
const SERVER_BASE = 'http://122.51.127.227:3000'; // 替换为你的服务器端口

// 方案2：使用域名（备案后使用）
// const SERVER_BASE = 'https://ideafactory.site';

class AIService {
  // ... 保持原有代码不变 ...

  /**
   * 新增：与你的服务器交互的方法
   */
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
        timeout: 30000, // 30秒超时
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.data?.msg || '请求失败'}`));
          }
        },
        fail: (error) => {
          console.error('请求服务器失败:', error);
          reject(new Error(error.errMsg || '网络请求失败'));
        }
      });
    });
  }

  // ... 保持其他原有方法不变 ...
}

// 创建单例实例
const aiService = new AIService();

module.exports = aiService;