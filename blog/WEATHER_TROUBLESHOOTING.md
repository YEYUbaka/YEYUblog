# 天气组件故障排查指南

## 🔍 常见错误及解决方法

### 错误 1：天气数据加载失败

**可能原因：**

1. **API Key 问题**
   - Key 未配置或配置错误
   - Key 已过期或被禁用
   - Key 权限不足

2. **城市名称问题**
   - 城市名称格式不正确
   - 城市名称不支持（如：`Jiangxia` 可能需要使用完整名称或城市ID）

3. **API 调用限制**
   - 免费版每天 500 次调用已用完
   - 调用频率过高

4. **网络问题**
   - CORS 跨域问题
   - 网络连接失败

## 🛠️ 排查步骤

### 步骤 1：检查浏览器控制台

1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页
3. 查看 Network 标签页，找到天气 API 请求

**查看错误信息：**
- 如果看到 `API Key 未配置` → 检查 `weather.js` 中的 `apiKey`
- 如果看到 `HTTP error! status: 401` → API Key 无效
- 如果看到 `HTTP error! status: 400` → 请求参数错误（可能是城市名称）
- 如果看到 `CORS` 错误 → 需要代理或使用 JSONP

### 步骤 2：测试 API 请求

在浏览器控制台中运行：

```javascript
// 测试 API 请求
fetch('https://api.seniverse.com/v3/weather/now.json?key=YOUR_API_KEY&location=beijing&language=zh-Hans&unit=c')
  .then(response => response.json())
  .then(data => console.log('API 响应:', data))
  .catch(error => console.error('请求失败:', error));
```

**替换 `YOUR_API_KEY` 为您的实际 Key**

### 步骤 3：检查城市名称

心知天气支持的城市名称格式：
- 英文名称：`beijing`, `shanghai`, `guangzhou`
- 中文名称：`北京`, `上海`, `广州`
- 城市ID：`WX4FBXXFKE4F`
- 经纬度：`39.9042:116.4074`

**如果使用 `Jiangxia`，尝试：**
- `江夏`（中文名称）
- `武汉`（如果江夏是武汉的一个区）
- 或使用城市ID

### 步骤 4：验证 API Key

访问心知天气控制台：
1. 登录 [心知天气控制台](https://www.seniverse.com/)
2. 查看 API Key 状态
3. 查看调用统计和剩余次数
4. 检查是否有错误日志

## 🔧 修复方案

### 方案 1：修复城市名称

编辑 `static/js/weather.js`：

```javascript
const config = {
    apiKey: 'P75YsgazRqHBSXQqM',
    location: '江夏',  // 使用中文名称
    // 或
    location: 'wuhan',  // 使用武汉
    // 或
    location: 'WX4FBXXFKE4F',  // 使用城市ID
    // ...
};
```

### 方案 2：添加错误详情显示

天气组件现在会显示更详细的错误信息。如果看到错误代码，可以：
- 查看控制台获取完整错误信息
- 根据错误代码查找解决方案

### 方案 3：使用 JSONP 解决 CORS（如果需要）

如果遇到 CORS 问题，可以修改代码使用 JSONP：

```javascript
// 使用 JSONP 方式
function fetchWeatherJSONP() {
    return new Promise((resolve, reject) => {
        const callbackName = 'weatherCallback_' + Date.now();
        window[callbackName] = function(data) {
            delete window[callbackName];
            document.body.removeChild(script);
            if (data.status_code) {
                reject(new Error(data.status));
            } else {
                resolve(data.results[0]);
            }
        };
        
        const script = document.createElement('script');
        script.src = `https://api.seniverse.com/v3/weather/now.json?key=${config.apiKey}&location=${config.location}&language=${config.language}&unit=${config.unit}&callback=${callbackName}`;
        document.body.appendChild(script);
    });
}
```

## 📝 测试清单

- [ ] API Key 已正确配置
- [ ] 城市名称格式正确
- [ ] 浏览器控制台无错误
- [ ] 网络请求返回 200 状态码
- [ ] API 返回数据格式正确
- [ ] 天气组件容器存在
- [ ] JavaScript 文件正确加载

## 💡 快速测试

在浏览器控制台运行以下代码测试：

```javascript
// 1. 检查容器是否存在
console.log('容器:', document.getElementById('weather-widget'));

// 2. 检查脚本是否加载
console.log('配置:', window.config || '未找到配置');

// 3. 测试 API
fetch('https://api.seniverse.com/v3/weather/now.json?key=P75YsgazRqHBSXQqM&location=beijing&language=zh-Hans&unit=c')
  .then(r => r.json())
  .then(d => console.log('测试结果:', d));
```

## 🔗 参考资源

- [心知天气 API 文档](https://docs.seniverse.com/api/weather/now.html)
- [城市列表查询](https://docs.seniverse.com/api/start/common.html#地点-location)
- [错误代码说明](https://docs.seniverse.com/api/start/error-code.html)

