import { Input } from 'antd';
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Input.Search
      aria-label={placeholder ?? 'Tìm kiếm'}
      allowClear
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: 280, maxWidth: '100%' }}
    />
  );
}
