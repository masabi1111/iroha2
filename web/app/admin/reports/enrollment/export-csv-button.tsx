'use client';

import {useTranslations} from 'next-intl';

export type CsvColumn<Row> = {
  key: keyof Row;
  header: string;
};

type ExportCsvButtonProps<Row extends Record<string, any>> = {
  rows: Row[];
  columns: CsvColumn<Row>[];
  filename: string;
};

export function ExportCsvButton<Row extends Record<string, any>>({ rows, columns, filename }: ExportCsvButtonProps<Row>) {
  const t = useTranslations('admin');

  const handleExport = () => {
    if (!rows.length) {
      return;
    }

    const header = columns.map((column) => escapeValue(column.header)).join(',');
    const body = rows
      .map((row) => columns.map((column) => escapeValue(row[column.key])).join(','))
      .join('\n');
    const csv = `${header}\n${body}`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" className="button" onClick={handleExport} disabled={!rows.length}>
      {t('actions.exportCsv')}
    </button>
  );
}

function escapeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
