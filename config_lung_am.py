# config_lung_am.py - 肺泡巨噬细胞 / 肺组织驻留巨噬细胞 检索配置

from config_base import JOURNALS_CAS1, RECENT_DAYS, MAX_BACKFILL_DAYS, SMTP_SERVER, SMTP_PORT, SENDER_EMAIL, SMTP_AUTH_CODE, RECEIVER_EMAILS

TOPICS = [
    {
        "name": "Lung-AM",
        "name_zh": "肺泡巨噬细胞 / 肺组织驻留巨噬细胞",
        "query": (
            '(("Tissue resident macrophages"[Title] OR '
            '"alveolar macrophag*"[Title] OR "lung macrophag*"[Title]) AND '
            f'({JOURNALS_CAS1}))'
        ),
        "fallback_query": (
            '"Tissue resident macrophages"[Title] OR '
            '"alveolar macrophag*"[Title] OR '
            '"lung macrophag*"[Title]'
        ),
        "max_results": 30,
    },
]
