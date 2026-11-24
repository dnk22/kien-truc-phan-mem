import { Typography } from 'antd';
import type { ReactNode } from 'react';
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <Typography.Title level={2}>{title}</Typography.Title>
        {description ? (
          <Typography.Paragraph type="secondary">
            {description}
          </Typography.Paragraph>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
