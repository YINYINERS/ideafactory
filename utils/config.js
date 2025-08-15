// 配置文件
const config = {
  // 开发环境
  development: {
    baseURL: 'http://localhost:3000/api',
    timeout: 10000
  },
  // 生产环境
  production: {
    baseURL: 'https://your-domain.com/api',
    timeout: 10000
  }
};

// 获取当前环境配置
const getCurrentConfig = () => {
  // 可以根据实际情况判断环境
  const isDev = true; // 开发时设为true，发布时设为false
  return isDev ? config.development : config.production;
};

module.exports = {
  config: getCurrentConfig()
};