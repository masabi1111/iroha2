import type {ReactNode} from 'react';

type ToolbarProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export function Toolbar({ title, description, actions, children }: ToolbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {title ? <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{title}</h1> : null}
          {description ? <span style={{ color: '#6b7280' }}>{description}</span> : null}
        </div>
        {actions ? <div className="actions">{actions}</div> : null}
      </div>
      {children ? <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>{children}</div> : null}
    </div>
  );
}
