import fetch from 'node-fetch';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const parseXml = promisify(parseString);
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
let configPath = join(__dirname, '../config/config.json');
if (existsSync(join(__dirname, '../config/config.local.json'))) {
  configPath = join(__dirname, '../config/config.local.json');
}

const configText = readFileSync(configPath, 'utf-8');
const config = JSON.parse(resolveConfig(configText));

/**
 * 从指定年份开始搜索论文（用于回退机制）
 */
export async function fetchFromPubMedSinceYear(keyword, startYear = 2020, maxResults = 10) {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  
  const startDate = `${startYear}/01/01`;
  const today = new Date();
  const endDate = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
  
  // 搜索（按日期降序）
  const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(keyword)}&datetype=pdat&mindate=${startDate}&maxdate=${endDate}&retmax=${maxResults}&retmode=json&sort=pub_date`;
  
  console.log(`[PubMed] 搜索 ${startYear} 年以来: ${keyword}`);
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  
  const ids = searchData.esearchresult?.idlist || [];
  if (ids.length === 0) {
    console.log(`[PubMed] 未找到论文`);
    return [];
  }
  
  console.log(`[PubMed] 找到 ${ids.length} 篇论文`);
  
  // 获取详情
  const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
  const fetchRes = await fetch(fetchUrl);
  const xmlText = await fetchRes.text();
  
  const result = await parseXml(xmlText);
  const articles = result.PubmedArticleSet?.PubmedArticle || [];
  
  return articles.map(article => parsePubmedArticle(article));
}

/**
 * 从 PubMed 搜索论文
 */
export async function fetchFromPubMed(keyword, daysBack = 1, maxResults = 20) {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  
  // 计算日期范围
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - daysBack);
  
  const dateRange = `${startDate.toISOString().slice(0, 10).replace(/-/g, '/')}:${today.toISOString().slice(0, 10).replace(/-/g, '/')}`;
  
  // 搜索
  const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(keyword)}&datetype=pdat&mindate=${startDate.toISOString().slice(0, 10)}&maxdate=${today.toISOString().slice(0, 10)}&retmax=${maxResults}&retmode=json`;
  
  console.log(`[PubMed] 搜索: ${keyword}`);
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  
  const ids = searchData.esearchresult?.idlist || [];
  if (ids.length === 0) {
    console.log(`[PubMed] 未找到新论文`);
    return [];
  }
  
  console.log(`[PubMed] 找到 ${ids.length} 篇论文`);
  
  // 获取详情
  const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
  const fetchRes = await fetch(fetchUrl);
  const xmlText = await fetchRes.text();
  
  const result = await parseXml(xmlText);
  const articles = result.PubmedArticleSet?.PubmedArticle || [];
  
  return articles.map(article => parsePubmedArticle(article));
}

/**
 * 解析 PubMed 论文数据
 */
function parsePubmedArticle(article) {
  const medline = article.MedlineCitation[0];
  const articleData = medline.Article[0];
  
  // 期刊信息
  const journal = articleData.Journal?.[0] || {};
  const journalTitle = journal.Title?.[0] || '';
  const journalAbbr = journal.ISOAbbreviation?.[0] || '';
  
  // 标题
  const title = articleData.ArticleTitle?.[0] || '无标题';
  
  // 作者
  const authors = (articleData.AuthorList?.[0]?.Author || []).map(author => {
    const lastName = author.LastName?.[0] || '';
    const foreName = author.ForeName?.[0] || '';
    return `${foreName} ${lastName}`.trim();
  });
  
  // 单位/机构
  const affiliations = [];
  (articleData.AuthorList?.[0]?.Author || []).forEach(author => {
    if (author.AffiliationInfo) {
      author.AffiliationInfo.forEach(aff => {
        if (aff.Affiliation?.[0]) {
          affiliations.push(aff.Affiliation[0]);
        }
      });
    }
  });
  
  // 摘要
  const abstractTexts = [];
  if (articleData.Abstract?.[0]?.AbstractText) {
    articleData.Abstract[0].AbstractText.forEach(text => {
      if (typeof text === 'string') {
        abstractTexts.push(text);
      } else if (text._) {
        const label = text.$?.Label ? `${text.$.Label}: ` : '';
        abstractTexts.push(label + text._);
      }
    });
  }
  const abstract = abstractTexts.join('\n');
  
  // 关键词
  const keywords = [];
  if (medline.KeywordList) {
    medline.KeywordList.forEach(list => {
      (list.Keyword || []).forEach(kw => {
        if (typeof kw === 'string') keywords.push(kw);
      });
    });
  }
  // MeSH terms
  if (medline.MeshHeadingList) {
    medline.MeshHeadingList.forEach(list => {
      (list.MeshHeading || []).forEach(mesh => {
        if (mesh.DescriptorName?.[0]) {
          keywords.push(mesh.DescriptorName[0]);
        }
      });
    });
  }
  
  // PMID
  const pmid = medline.PMID?.[0]?._ || medline.PMID?.[0] || '';
  
  // DOI
  const eloc = articleData.ELocationID?.find(el => el.$?.EIdType === 'doi');
  const doi = eloc?._ || '';
  
  // 发表日期
  const pubDate = articleData.Journal?.[0]?.JournalIssue?.[0]?.PubDate?.[0];
  let pubDateStr = '';
  if (pubDate) {
    const year = pubDate.Year?.[0] || '';
    const month = pubDate.Month?.[0] || '';
    const day = pubDate.Day?.[0] || '';
    pubDateStr = `${year}-${month}-${day}`.replace(/-+$/, '');
  }
  
  // 检查是否有有效摘要
  const hasAbstract = abstract && abstract.trim().length > 0 && 
    !abstract.toLowerCase().includes('no abstract available');
  
  return {
    pmid,
    doi,
    title,
    authors,
    affiliations: [...new Set(affiliations)],
    abstract,
    hasAbstract,
    keywords: [...new Set(keywords)],
    pubDate: pubDateStr,
    journal: journalTitle,
    journalAbbr,
    url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
  };
}

/**
 * 过滤掉没有摘要的论文
 */
export function filterPapersWithAbstract(papers) {
  const filtered = papers.filter(paper => paper.hasAbstract);
  const removed = papers.length - filtered.length;
  if (removed > 0) {
    console.log(`[过滤] 移除 ${removed} 篇无摘要论文`);
  }
  return filtered;
}

/**
 * 获取所有关键词的论文
 */
export async function fetchAllPapers() {
  const { keywords, sources, maxResults, daysBack } = config.search || { keywords: [], sources: ['pubmed'], maxResults: 20, daysBack: 7 };
  const allPapers = [];
  
  for (const keyword of keywords) {
    if (sources.includes('pubmed')) {
      try {
        const papers = await fetchFromPubMed(keyword, daysBack, maxResults);
        allPapers.push(...papers);
        // 避免请求过快
        await new Promise(r => setTimeout(r, 1000));
      } catch (error) {
        console.error(`[PubMed] 获取失败: ${keyword}`, error.message);
      }
    }
  }
  
  // 去重（根据 PMID）
  const uniquePapers = [];
  const seenIds = new Set();
  for (const paper of allPapers) {
    if (!seenIds.has(paper.pmid)) {
      seenIds.add(paper.pmid);
      uniquePapers.push(paper);
    }
  }
  
  console.log(`[总计] 获取 ${uniquePapers.length} 篇唯一论文`);
  return uniquePapers;
}

// 测试运行
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fetchAllPapers().then(papers => {
    console.log(JSON.stringify(papers.slice(0, 2), null, 2));
  });
}
