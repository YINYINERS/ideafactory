const { config } = require('./config.js');

/**
 * 封装的HTTP请求方法
 */
class Request {
  constructor() {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
  }

  /**
   * 通用请求方法
   */
  request(options) {
    return new Promise((resolve, reject) => {
      // 显示加载提示
      if (options.showLoading !== false) {
        wx.showLoading({
          title: options.loadingText || '请求中...',
          mask: true
        });
      }

      // 构建完整URL
      const url = options.url.startsWith('http') 
        ? options.url 
        : `${this.baseURL}${options.url}`;

      // 发起请求
      wx.request({
        url: url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': wx.getStorageSync('token') || '',
          ...options.header
        },
        timeout: this.timeout,
        success: (res) => {
          wx.hideLoading();
          
          // 请求成功
          if (res.statusCode === 200) {
            // 检查业务状态码
            if (res.data.code === 0 || res.data.success) {
              resolve(res.data);
            } else {
              // 业务错误
              this.handleError(res.data.message || '请求失败');
              reject(res.data);
            }
          } else {
            // HTTP错误
            this.handleError(`请求失败: ${res.statusCode}`);
            reject(res);
          }
        },
        fail: (error) => {
          wx.hideLoading();
          console.error('请求失败:', error);
          
          // 网络错误处理
          if (error.errMsg.includes('timeout')) {
            this.handleError('请求超时，请检查网络连接');
          } else if (error.errMsg.includes('fail')) {
            this.handleError('网络连接失败，请检查网络设置');
          } else {
            this.handleError('请求失败，请稍后重试');
          }
          
          reject(error);
        }
      });
    });
  }

  /**
   * GET请求
   */
  get(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'GET',
      data,
      ...options
    });
  }

  /**
   * POST请求
   */
  post(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    });
  }

  /**
   * 错误处理
   */
  handleError(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  }
}

// 创建实例
const request = new Request();

module.exports = request;