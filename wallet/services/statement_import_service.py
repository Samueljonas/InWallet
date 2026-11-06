import csv
import hashlib
import io
import re
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from django.db import transaction as db_transaction
from django.utils import timezone

from wallet.models import Account, Category, Transaction
from .transaction_service import TransactionService


class StatementImportService:
    """
    Serviço responsável pela leitura, normalização, deduplicação e importação
    atômica de extratos bancários nos formatos OFX (Open Financial Exchange) e CSV
    (Nubank, Itaú, Inter, Bradesco, C6 e formato universal).
    """

    KEYWORD_HINTS = {
        'expense': {
            'alimentação': ['ifood', 'rappi', 'mercado', 'supermercado', 'padaria', 'restaurante', 'lanchonete', 'burger', 'cafe', 'assai', 'carrefour', 'pao de acucar'],
            'transporte': ['uber', '99app', '99*', 'posto', 'combustivel', 'gasolina', 'estacionamento', 'sem parar', 'veloe', 'metro', 'onibus', 'pedagio'],
            'moradia': ['aluguel', 'condominio', 'energia', 'enel', 'cpfl', 'light', 'sabesp', 'agua', 'gas', 'iptu', 'internet', 'vivo', 'claro', 'tim'],
            'saúde': ['farmacia', 'drogasil', 'droga raia', 'pague menos', 'panvel', 'hospital', 'clinica', 'consulta', 'exame', 'unimed'],
            'assinaturas': ['netflix', 'spotify', 'amazon', 'prime', 'disney', 'youtube', 'google', 'apple', 'icloud', 'chatgpt', 'openai'],
        },
        'income': {
            'salário': ['salario', 'pagamento', 'folha', 'adiantamento', 'pro-labore', 'prolabore'],
            'rendimentos': ['rendimento', 'dividendo', 'jcp', 'tesouro', 'cdb', 'fii'],
            'transferências': ['pix recebido', 'transferencia recebida', 'ted recebida'],
        },
    }

    @classmethod
    def parse_amount(cls, raw_val: str) -> Decimal | None:
        if raw_val is None:
            return None
        s = str(raw_val).strip().replace('R$', '').replace(' ', '')
        if not s:
            return None
        # Formato brasileiro "1.234,56" -> "1234.56"
        if ',' in s and '.' in s:
            if s.rfind(',') > s.rfind('.'):
                s = s.replace('.', '').replace(',', '.')
            else:
                s = s.replace(',', '')
        elif ',' in s:
            s = s.replace(',', '.')
        try:
            return Decimal(s)
        except InvalidOperation:
            return None

    @classmethod
    def parse_date(cls, raw_date: str) -> date:
        if not raw_date:
            return timezone.now().date()
        s = str(raw_date).strip()

        # Formato OFX: YYYYMMDD ou YYYYMMDDHHMMSS[-3:BRT]
        ofx_match = re.match(r'^(\d{4})(\d{2})(\d{2})', s)
        if ofx_match:
            try:
                return date(int(ofx_match.group(1)), int(ofx_match.group(2)), int(ofx_match.group(3)))
            except ValueError:
                pass

        for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%d/%m/%y', '%Y/%m/%d'):
            try:
                return datetime.strptime(s[:10], fmt).date()
            except ValueError:
                continue

        return timezone.now().date()

    @classmethod
    def parse_ofx(cls, content: str) -> list[dict]:
        """Extrai transações de arquivos OFX 1.x (SGML) e 2.x (XML)."""
        entries = []
        blocks = re.findall(r'<STMTTRN>(.*?)(?:</STMTTRN>|(?=<STMTTRN>)|(?=</BANKTRANLIST>))', content, flags=re.DOTALL | re.IGNORECASE)

        def extract_tag(block: str, tag: str) -> str:
            m = re.search(rf'<{tag}>([^<\r\n]+)', block, flags=re.IGNORECASE)
            return m.group(1).strip() if m else ''

        for block in blocks:
            raw_amt = extract_tag(block, 'TRNAMT')
            amt = cls.parse_amount(raw_amt)
            if amt is None or amt == Decimal('0'):
                continue

            tx_date = cls.parse_date(extract_tag(block, 'DTPOSTED'))
            fitid = extract_tag(block, 'FITID')
            memo = extract_tag(block, 'MEMO')
            name = extract_tag(block, 'NAME')
            description = (memo or name or 'Lançamento OFX').strip()[:250]
            tx_type = 'income' if amt > 0 else 'expense'

            entries.append({
                'date': tx_date,
                'amount': abs(amt).quantize(Decimal('0.01')),
                'type': tx_type,
                'description': description,
                'external_ref': fitid or cls._build_hash(tx_date, amt, description),
                'payment_method': 'Extrato OFX',
            })

        return entries

    @classmethod
    def parse_csv(cls, content: str) -> list[dict]:
        """Extrai transações de arquivos CSV de bancos brasileiros ou planilhas universais."""
        entries = []
        clean_content = content.lstrip('\ufeff').strip()
        if not clean_content:
            return entries

        first_line = clean_content.splitlines()[0]
        delimiter = ';' if first_line.count(';') > first_line.count(',') else ','

        reader = csv.DictReader(io.StringIO(clean_content), delimiter=delimiter)
        if not reader.fieldnames:
            return entries

        def find_col(row_dict: dict, candidates: list[str]) -> str:
            for k, v in row_dict.items():
                if not k:
                    continue
                norm_k = k.strip().lower()
                if norm_k in candidates:
                    return str(v or '').strip()
            return ''

        for row in reader:
            raw_date = find_col(row, ['data', 'date', 'dt', 'data lançamento', 'data lancamento'])
            raw_amount = find_col(row, ['valor', 'amount', 'value', 'quantia', 'valor (r$)'])
            description = find_col(row, [
                'descrição', 'descricao', 'description', 'histórico', 'historico',
                'memo', 'título', 'titulo', 'title', 'estabelecimento', 'lancamento'
            ])
            ext_id = find_col(row, ['identificador', 'id', 'fitid', 'documento', 'codigo'])
            raw_type = find_col(row, ['tipo', 'type', 'natureza'])

            amt = cls.parse_amount(raw_amount)
            if amt is None or amt == Decimal('0'):
                continue

            tx_date = cls.parse_date(raw_date)
            if raw_type.lower() in ('income', 'receita', 'credito', 'crédito', 'entrada', 'c'):
                tx_type = 'income'
            elif raw_type.lower() in ('expense', 'despesa', 'debito', 'débito', 'saida', 'saída', 'd'):
                tx_type = 'expense'
            else:
                tx_type = 'income' if amt > 0 else 'expense'

            desc_clean = (description or 'Lançamento Importado').strip()[:250]
            ref = ext_id or cls._build_hash(tx_date, amt, desc_clean)

            entries.append({
                'date': tx_date,
                'amount': abs(amt).quantize(Decimal('0.01')),
                'type': tx_type,
                'description': desc_clean,
                'external_ref': ref,
                'payment_method': 'Extrato CSV',
            })

        return entries

    @staticmethod
    def _build_hash(tx_date: date, amount: Decimal, description: str) -> str:
        raw = f"{tx_date.isoformat()}|{amount:.2f}|{description.lower().strip()}"
        return hashlib.sha1(raw.encode('utf-8')).hexdigest()[:16]

    @classmethod
    def _resolve_category(cls, user, tx_type: str, description: str, user_categories: dict) -> Category:
        desc_lower = description.lower()

        # 1. Tenta casar pelo nome exato/parcial de uma categoria já existente do usuário
        for (cat_type, cat_name_lower), cat_obj in user_categories.items():
            if cat_type == tx_type and cat_name_lower in desc_lower:
                return cat_obj

        # 2. Tenta casar por palavras-chave inteligentes
        hints = cls.KEYWORD_HINTS.get(tx_type, {})
        for target_cat_name, keywords in hints.items():
            if any(kw in desc_lower for kw in keywords):
                existing = user_categories.get((tx_type, target_cat_name.lower()))
                if existing:
                    return existing
                created, _ = Category.objects.get_or_create(
                    user=user,
                    name=target_cat_name.capitalize(),
                    type=tx_type,
                )
                user_categories[(tx_type, target_cat_name.lower())] = created
                return created

        # 3. Fallback para categoria padrão do tipo
        fallback_name = 'Outras Receitas' if tx_type == 'income' else 'Outras Despesas'
        fallback = user_categories.get((tx_type, fallback_name.lower()))
        if not fallback:
            fallback, _ = Category.objects.get_or_create(
                user=user,
                name=fallback_name,
                type=tx_type,
            )
            user_categories[(tx_type, fallback_name.lower())] = fallback
        return fallback

    @classmethod
    @db_transaction.atomic
    def import_statement(cls, user, account: Account, filename: str, content: str) -> dict:
        """
        Processa o conteúdo de um arquivo .ofx ou .csv, deduplica lançamentos
        e registra as transações atualizando o saldo da conta.
        """
        lower_name = (filename or '').lower().strip()
        if lower_name.endswith('.ofx') or '<OFX' in content.upper() or '<STMTTRN>' in content.upper():
            parsed_entries = cls.parse_ofx(content)
        else:
            parsed_entries = cls.parse_csv(content)

        user_categories = {
            (c.type, c.name.lower()): c
            for c in Category.objects.filter(user=user)
        }

        # Pré-carrega todas as tags [REF:...] existentes na conta em 1 única consulta
        # (evita N+1 queries durante a importação de extratos longos)
        existing_notes = Transaction.objects.filter(
            user=user,
            account=account,
            note__contains='[REF:',
        ).values_list('note', flat=True)
        existing_refs: set[str] = set()
        for note_str in existing_notes:
            if note_str:
                for match in re.findall(r'\[REF:([^\]]+)\]', note_str):
                    existing_refs.add(match)

        imported_count = 0
        skipped_count = 0
        total_income = Decimal('0.00')
        total_expense = Decimal('0.00')

        for item in parsed_entries:
            ext_ref = item['external_ref']
            ref_tag = f"[REF:{ext_ref}]"

            # Verifica duplicidade em O(1) na memória (tanto contra o banco quanto dentro do mesmo arquivo)
            if ext_ref in existing_refs:
                skipped_count += 1
                continue
            existing_refs.add(ext_ref)

            category = cls._resolve_category(
                user=user,
                tx_type=item['type'],
                description=item['description'],
                user_categories=user_categories,
            )

            TransactionService.create_transaction(
                user=user,
                account=account,
                category=category,
                tx_type=item['type'],
                amount=item['amount'],
                date=item['date'],
                description=item['description'],
                payment_method=item['payment_method'],
                note=ref_tag,
            )

            imported_count += 1
            if item['type'] == 'income':
                total_income += item['amount']
            else:
                total_expense += item['amount']

        account.refresh_from_db()
        return {
            'imported_count': imported_count,
            'skipped_count': skipped_count,
            'total_parsed': len(parsed_entries),
            'total_income': str(total_income),
            'total_expense': str(total_expense),
            'account_balance': str(account.balance),
        }

