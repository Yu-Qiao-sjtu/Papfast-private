/**
 * Papfast 公共配置模块
 * 
 * 统一配置加载逻辑，避免每个 src 文件重复 resolveConfig + loadConfig
 * 优先使用 config.local.json（本地测试），否则使用 config.json（GitHub Actions）
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 替换配置中的环境变量占位符
 */
function resolveConfig(configStr) {
  return configStr.replace(/\$\{([^}]+)\}/g, (match, key) => {
    const value = process.env[key];
    if (!value) {
      console.warn(`[警告] 环境变量 ${key} 未设置`);
      return match;
    }
    return value;
  });
}

// 加载配置：优先使用 config.local.json（本地测试），否则使用 config.json（GitHub Actions）
const localConfigPath = join(__dirname, '../config/config.local.json');
let configPath = join(__dirname, '../config/config.json');
if (existsSync(localConfigPath)) {
  configPath = localConfigPath;
}

const configText = readFileSync(configPath, 'utf-8');
const config = JSON.parse(resolveConfig(configText));

export { config, configPath };
export default config;
