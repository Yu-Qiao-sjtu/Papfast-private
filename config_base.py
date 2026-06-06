# config_base.py - 共享配置（邮箱、期刊白名单）

import os

# ========== 期刊白名单（中科院1区顶刊） ==========
JOURNALS_CAS1 = (
    # --- Nature 系列 ---
    '"Nature"[Journal] OR '
    '"Nature Immunol*"[Journal] OR '
    '"Nature Med*"[Journal] OR '
    '"Nature Cell Biol*"[Journal] OR '
    '"Nature Commun*"[Journal] OR '
    '"Nat Rev Immunol*"[Journal] OR '
    '"Nat Rev Mol Cell Biol*"[Journal] OR '
    '"Nat Rev Cancer"[Journal] OR '
    '"Nat Rev Drug Discov*"[Journal] OR '
    '"Nat Rev Dis Primers"[Journal] OR '
    '"Nat Rev Microbiol*"[Journal] OR '
    '"Nat Rev Genet*"[Journal] OR '
    '"Nat Rev Clin Oncol*"[Journal] OR '
    '"Nat Rev Neurosci*"[Journal] OR '
    '"Nat Rev Cardiol*"[Journal] OR '
    '"Nat Rev Rheumatol*"[Journal] OR '
    '"Nat Rev Gastroenterol Hepatol*"[Journal] OR '
    '"Nat Microbiol*"[Journal] OR '
    '"Nat Neurosci*"[Journal] OR '
    '"Nat Genet*"[Journal] OR '
    '"Nat Metab*"[Journal] OR '
    '"Nat Biomed Eng*"[Journal] OR '
    '"Nat Cancer*"[Journal] OR '
    '"Nat Aging*"[Journal] OR '
    '"Nat Biotechnol*"[Journal] OR '
    '"Nat Methods"[Journal] OR '
    '"Nat Struct Mol Biol*"[Journal] OR '
    '"Nat Chem Biol*"[Journal] OR '
    '"Nat Nanotechnol*"[Journal] OR '
    '"Nat Mater*"[Journal] OR '
    # --- Science 系列 ---
    '"Science"[Journal] OR '
    '"Sci Immunol*"[Journal] OR '
    '"Sci Transl Med*"[Journal] OR '
    '"Sci Adv*"[Journal] OR '
    '"Sci Signal*"[Journal] OR '
    # --- Cell 系列 ---
    '"Cell"[Journal] OR '
    '"Immunity"[Journal] OR '
    '"Cell Host Microbe"[Journal] OR '
    '"Cell Stem Cell"[Journal] OR '
    '"Mol Cell"[Journal] OR '
    '"Cell Metab*"[Journal] OR '
    '"Cancer Cell"[Journal] OR '
    '"Cancer Discov*"[Journal] OR '
    '"Cell Res*"[Journal] OR '
    '"Cell Discov*"[Journal] OR '
    '"Cell Rep Med*"[Journal] OR '
    '"Cell Syst*"[Journal] OR '
    '"Med"[Journal] OR '
    # --- 综合医学顶刊 ---
    '"Lancet"[Journal] OR '
    '"Lancet Respir Med*"[Journal] OR '
    '"Lancet Oncol*"[Journal] OR '
    '"Lancet Infect Dis*"[Journal] OR '
    '"N Engl J Med"[Journal] OR '
    '"JAMA"[Journal] OR '
    '"BMJ"[Journal] OR '
    '"Ann Intern Med"[Journal] OR '
    # --- 生物学/医学1区 ---
    '"J Exp Med*"[Journal] OR '
    '"J Clin Invest*"[Journal] OR '
    '"EMBO J"[Journal] OR '
    '"EMBO Mol Med*"[Journal] OR '
    '"Proc Natl Acad Sci U S A"[Journal] OR '
    '"PLoS Biol*"[Journal] OR '
    '"Blood"[Journal] OR '
    '"Circulation"[Journal] OR '
    '"Annu Rev Immunol*"[Journal] OR '
    '"Annu Rev Med*"[Journal] OR '
    '"Immunol Rev*"[Journal] OR '
    '"Trends Immunol*"[Journal] OR '
    '"Signal Transduct Target Ther"[Journal] OR '
    # --- 呼吸1区 ---
    '"Am J Respir Crit Care Med"[Journal] OR '
    '"Thorax"[Journal] OR '
    '"Eur Respir J"[Journal] OR '
    # --- 免疫/变态反应1区 ---
    '"Allergy"[Journal] OR '
    '"J Allergy Clin Immunol*"[Journal] OR '
    # --- 消化1区 ---
    '"Gastroenterology"[Journal] OR '
    '"Gut"[Journal] OR '
    '"Hepatology"[Journal] OR '
    # --- 综合医学补充1区 ---
    '"JAMA Intern Med*"[Journal] OR '
    '"JAMA Oncol*"[Journal] OR '
    '"Lancet Digit Health"[Journal] OR '
    # --- 心血管/肾脏1区 ---
    '"Eur Heart J"[Journal] OR '
    '"Kidney Int*"[Journal] OR '
    '"Nat Cardiovasc Res"[Journal] OR '
    # --- 方法/基因治疗/综合1区 ---
    '"Nat Protoc"[Journal] OR '
    '"Mol Ther*"[Journal] OR '
    '"Adv Sci*"[Journal] OR '
    # --- 肿瘤1区 ---
    '"J Clin Oncol*"[Journal] OR '
    '"Ann Oncol*"[Journal] OR '
    '"Cancer Res*"[Journal] OR '
    '"Clin Cancer Res*"[Journal] OR '
    '"J Immunother Cancer*"[Journal] OR '
    # --- 心肺移植1区 ---
    '"J Heart Lung Transplant*"[Journal]'
)

RECENT_DAYS = 7
MAX_BACKFILL_DAYS = 90

# ========== 邮箱设置（从环境变量读取，可被 config.local.json 覆盖） ==========
SMTP_SERVER = "smtp.163.com"
SMTP_PORT = 465
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "yourname@163.com")
SMTP_AUTH_CODE = os.environ["SMTP_AUTH_CODE"]

# ========== 收件人列表（从环境变量读取） ==========
RECEIVER_EMAILS = os.environ.get("RECEIVER_EMAILS", "yourname@example.com").split(,")
