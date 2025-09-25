import Link from 'next/link';
import type {ReactNode} from 'react';

export type TableColumn<T> = {
  key: string;
  header: ReactNode;
  render: (item: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
};

export type Pagination = {
  page: number;
  pageCount: number;
  prevHref?: string;
  nextHref?: string;
  summary?: ReactNode;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  getRowKey?: (item: T, index: number) => string | number;
  emptyMessage?: ReactNode;
  pagination?: Pagination | null;
};

export function Table<T>({ columns, data, getRowKey, emptyMessage, pagination }: TableProps<T>) {
  if (!data.length && emptyMessage) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="list-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ textAlign: column.align ?? 'left' }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={getRowKey ? getRowKey(item, index) : index}>
              {columns.map((column) => (
                <td key={column.key} style={{ textAlign: column.align ?? 'left' }}>
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pagination ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          {pagination.summary ? (
            <span style={{ color: '#4b5563', fontSize: '0.9rem' }}>{pagination.summary}</span>
          ) : (
            <span />
          )}
          <div className="actions">
            {pagination.prevHref ? (
              <Link className="button" href={pagination.prevHref} prefetch={false}>
                &larr;
              </Link>
            ) : null}
            {pagination.nextHref ? (
              <Link className="button" href={pagination.nextHref} prefetch={false}>
                &rarr;
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
