// 心知天气 API 组件
// 参考文档：https://docs.seniverse.com/api/weather/now.html
// 请到 https://www.seniverse.com/ 注册并获取您的 API Key

(function() {
    'use strict';
    
    // 配置参数
    const config = {
        apiKey: 'S7x9AjkuHpr2jZqLy',  // 请替换为您的心知天气 API Key
        location: 'wuhan',              // 城市名称或城市ID，例如：beijing, shanghai, wuhan（武汉）
                                        // 注意：如果使用区县名称，建议使用上级城市名称或城市ID
        language: 'zh-Hans',           // 语言：zh-Hans（简体中文）、zh-Hant（繁体中文）、en（英文）等
        unit: 'c',                     // 单位：c（摄氏度）或 f（华氏度）
        updateInterval: 30 * 60 * 1000, // 更新间隔（毫秒），默认30分钟
        containerId: 'tp-weather-widget'   // 容器ID，和 header.html / CSS 保持一致
    };
    
    // 天气图标映射（根据天气代码）
    const weatherIcons = {
        '0': '☀️',   // 晴
        '1': '🌤️',   // 少云
        '2': '⛅',   // 晴间多云
        '3': '☁️',   // 多云
        '4': '🌫️',   // 阴
        '5': '🌦️',   // 有雨
        '6': '🌧️',   // 雨
        '7': '⛈️',   // 雷阵雨
        '8': '🌨️',   // 雪
        '9': '❄️',   // 暴雪
        '10': '🌩️',  // 雷暴
        '11': '🌪️',  // 大风
        '12': '🌫️',  // 雾
        '13': '🌫️',  // 霾
        '14': '🌫️',  // 沙尘
        '15': '🌫️',  // 浮尘
        '16': '🌫️',  // 扬沙
        '17': '🌫️',  // 强沙尘暴
        '18': '🌫️',  // 浓雾
        '19': '🌫️',  // 强浓雾
        '20': '🌫️',  // 大雾
        '21': '🌫️',  // 特强浓雾
        '22': '🌫️',  // 热
        '23': '❄️',  // 冷
        '24': '🌡️',  // 未知
    };
    
    // 获取天气数据
    async function fetchWeather() {
        if (!config.apiKey || config.apiKey === 'YOUR_API_KEY_HERE') {
            console.warn('心知天气 API Key 未配置');
            return { error: 'API Key 未配置' };
        }
        
        const url = `https://api.seniverse.com/v3/weather/now.json?key=${encodeURIComponent(config.apiKey)}&location=${encodeURIComponent(config.location)}&language=${config.language}&unit=${config.unit}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            // 检查 API 返回的错误
            if (data.status_code) {
                console.error('心知天气 API 错误:', data.status, data.status_code);
                return { 
                    error: data.status || 'API 错误',
                    code: data.status_code 
                };
            }
            
            if (!response.ok) {
                console.error('HTTP 错误:', response.status, data);
                return { 
                    error: `HTTP 错误: ${response.status}`,
                    details: data 
                };
            }
            
            if (data.results && data.results.length > 0) {
                return data.results[0];
            } else {
                console.error('天气数据格式错误:', data);
                return { 
                    error: '数据格式错误',
                    details: data 
                };
            }
        } catch (error) {
            console.error('获取天气数据失败:', error);
            // 检查是否是网络错误
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                return { error: '网络连接失败，请检查网络' };
            }
            return { error: error.message || '未知错误' };
        }
    }
    
    // 渲染天气组件
    function renderWeather(weatherData) {
        const container = document.getElementById(config.containerId);
        if (!container) {
            console.warn('天气组件容器不存在');
            return;
        }
        
        // 检查是否有错误
        if (!weatherData || weatherData.error) {
            const errorMsg = weatherData?.error || '天气数据加载失败';
            const errorCode = weatherData?.code ? ` (错误代码: ${weatherData.code})` : '';
            container.innerHTML = `<div class="weather-error" title="点击查看控制台获取详细信息">${errorMsg}${errorCode}</div>`;
            return;
        }
        
        // 检查必要字段
        if (!weatherData.location || !weatherData.now) {
            container.innerHTML = '<div class="weather-error">天气数据格式错误</div>';
            return;
        }
        
        const { location, now, last_update } = weatherData;
        const icon = weatherIcons[now.code] || '🌡️';
        const temperature = now.temperature;
        const text = now.text;
        const cityName = location.name;
        
        // 构建HTML
        container.innerHTML = `
            <div class="weather-widget-content">
                <div class="weather-icon">${icon}</div>
                <div class="weather-info">
                    <div class="weather-city">${cityName}</div>
                    <div class="weather-temp">${temperature}°${config.unit === 'c' ? 'C' : 'F'}</div>
                    <div class="weather-text">${text}</div>
                </div>
            </div>
        `;
        
        // 添加样式（如果还没有）
        if (!document.getElementById('weather-widget-style')) {
            const style = document.createElement('style');
            style.id = 'weather-widget-style';
            style.textContent = `
                #${config.containerId} {
                    display: inline-block;
                    padding: 10px 15px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                }
                #${config.containerId}:hover {
                    background: rgba(255, 255, 255, 0.15);
                }
                .weather-widget-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .weather-icon {
                    font-size: 32px;
                    line-height: 1;
                }
                .weather-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .weather-city {
                    font-size: 14px;
                    opacity: 0.8;
                }
                .weather-temp {
                    font-size: 20px;
                    font-weight: bold;
                }
                .weather-text {
                    font-size: 12px;
                    opacity: 0.7;
                }
                .weather-error {
                    padding: 10px;
                    color: #ff6b6b;
                    font-size: 12px;
                }
                /* 夜间模式适配 */
                [data-theme="dark"] #${config.containerId} {
                    background: rgba(255, 255, 255, 0.05);
                }
                [data-theme="dark"] #${config.containerId}:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // 初始化
    async function init() {
        // 创建容器（如果不存在）
        let container = document.getElementById(config.containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = config.containerId;
            // 查找插入位置（在导航栏下方）
            const header = document.querySelector('header');
            if (header) {
                header.appendChild(container);
            } else {
                document.body.insertBefore(container, document.body.firstChild);
            }
        }
        
        // 加载天气数据
        const weatherData = await fetchWeather();
        renderWeather(weatherData);
        
        // 设置定时更新
        setInterval(async () => {
            const weatherData = await fetchWeather();
            renderWeather(weatherData);
        }, config.updateInterval);
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
