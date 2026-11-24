import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { errorMessage } from '../../../shared/utils/errorMessage';
export function useInventoryMutation<T>(
  action: (input: T) => Promise<unknown>,
) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ['inventory'] });
      void message.success('Đã lưu thay đổi.');
    },
    onError: (error) => void message.error(errorMessage(error)),
  });
}
