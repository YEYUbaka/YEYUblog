# 配置文件修复说明

## 当前问题

Hugo 主题在生成 schema JSON 时出错，可能是因为：
1. 社交链接配置格式问题
2. 菜单配置中某些字段缺失
3. baseURL 格式问题

## 解决方案

### 方案 1：使用本地开发配置（推荐）

对于本地开发，使用以下 baseURL：
```toml
baseURL = 'http://localhost:1313/blog/'
```

### 方案 2：简化配置

如果仍然出错，可以尝试：
1. 暂时注释掉社交链接
2. 简化菜单配置
3. 使用主题的默认配置

### 方案 3：检查主题版本

确保使用的是最新版本的 Paper Mod 主题：
```powershell
cd themes/paper
git pull
```

## 临时解决方案

如果问题持续，可以尝试：

1. **使用主题的示例配置**
   ```powershell
   # 备份当前配置
   copy config.toml config.toml.backup
   
   # 复制主题示例配置
   copy themes\paper\exampleSite\config.yml config.yml
   ```

2. **或者使用 config.yaml 格式**

   将 `config.toml` 重命名为 `config.yaml` 并转换为 YAML 格式。

## 测试步骤

1. 确保主题已正确安装
2. 检查配置文件语法
3. 尝试运行：`hugo server -D --verbose`
4. 查看详细错误信息

