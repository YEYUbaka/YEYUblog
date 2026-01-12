# 天气组件快速修复

## 🔧 城市名称问题

如果显示"天气数据加载失败"，很可能是城市名称格式不正确。

### 问题：`Jiangxia` 可能不被识别

心知天气 API 可能不支持区县级别的英文名称。建议使用：

### 解决方案

编辑 `static/js/weather.js`，修改 `location` 配置：

**方案 1：使用城市名称（推荐）**
```javascript
location: 'wuhan',  // 武汉
// 或
location: '武汉',    // 中文名称
```

**方案 2：使用城市ID**
```javascript
location: 'WX4FBXXFKE4F',  // 武汉的城市ID（需要查询）
```

**方案 3：使用经纬度**
```javascript
location: '30.52:114.31',  // 江夏区的经纬度（示例）
```

## 🧪 快速测试

在浏览器控制台（F12）运行以下代码测试：

```javascript
// 测试不同的城市名称
const testCities = ['wuhan', '武汉', 'beijing', '北京'];
const apiKey = 'P75YsgazRqHBSXQqM';

testCities.forEach(city => {
    fetch(`https://api.seniverse.com/v3/weather/now.json?key=${apiKey}&location=${city}&language=zh-Hans&unit=c`)
        .then(r => r.json())
        .then(d => {
            if (d.status_code) {
                console.log(`${city}: ❌ ${d.status} (${d.status_code})`);
            } else {
                console.log(`${city}: ✅ ${d.results[0].location.name} - ${d.results[0].now.temperature}°C`);
            }
        })
        .catch(e => console.error(`${city}: ❌`, e));
});
```

找到能正常返回数据的城市名称，然后更新配置。

## 📋 常见城市名称

- `beijing` 或 `北京` - 北京
- `shanghai` 或 `上海` - 上海
- `guangzhou` 或 `广州` - 广州
- `shenzhen` 或 `深圳` - 深圳
- `wuhan` 或 `武汉` - 武汉
- `hangzhou` 或 `杭州` - 杭州

## ✅ 修复后

1. 修改 `location` 配置
2. 刷新页面
3. 查看浏览器控制台，确认 API 请求成功
4. 天气组件应该正常显示

