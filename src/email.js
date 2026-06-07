import nodemailer from 'nodemailer';
import { generateEmailHtml } from './wechat-style.js';
import config from './config.js';

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: config.email.smtp.secure,
  auth: {
    user: config.email.smtp.user,
    pass: config.email.smtp.pass
  }
});

/**
 * 发送论文邮件
 * 支持模板风格：full（详细版）或 compact（简洁版）
 * 在 config 中设置 email.templateStyle 来切换
 */
export async function sendPaperEmail(papers, moduleName = '论文', recipients = null, isFallback = false, fallbackYear = null) {
  if (papers.length === 0) {
    console.log('[邮件] 没有新论文，跳过发送');
    return false;
  }

  const date = new Date();
  const dateStr = date.toLocaleDateString('zh-CN');

  const to = recipients || config.email.to;

  // 邮件标题也区分模式
  const subjectPrefix = isFallback ? `📚 ${moduleName}论文精选` : `📊 ${moduleName}论文日报`;

  // 获取模板风格配置（默认 full）
  const templateStyle = config.email.templateStyle || 'full';

  const mailOptions = {
    from: `"Papfast 论文订阅" <${config.email.from}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject: `${subjectPrefix} - ${dateStr} (${papers.length}篇)`,
    html: generateEmailHtml(papers, date, moduleName, isFallback, fallbackYear, templateStyle)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[邮件] 发送成功 (${templateStyle}模板): ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[邮件] 发送失败:', error.message);
    throw error;
  }
}

/**
 * 发送测试邮件
 */
export async function sendTestEmail() {
  const mailOptions = {
    from: `"Papfast 论文订阅" <${config.email.from}>`,
    to: config.email.to,
    subject: '✅ Papfast 邮件配置测试',
    html: `
      <h1>邮件配置测试成功！</h1>
      <p>如果你收到这封邮件，说明 Papfast 的邮件配置已经正确设置。</p>
      <p>配置信息：</p>
      <ul>
        <li>SMTP 服务器: ${config.email.smtp.host}:${config.email.smtp.port}</li>
        <li>发件邮箱: ${config.email.from}</li>
        <li>收件邮箱: ${config.email.to}</li>
      </ul>
      <p>接下来将开始定期推送论文。</p>
    `
  };
  
  const info = await transporter.sendMail(mailOptions);
  console.log(`[测试邮件] 发送成功: ${info.messageId}`);
  return info;
}
