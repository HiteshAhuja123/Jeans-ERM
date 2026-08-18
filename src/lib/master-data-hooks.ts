import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { MasterDataService } from "@/lib/master-data-service";

export function createMasterDataHooks<T extends { id: string; status: string }>(
  queryKey: string,
  service: MasterDataService<T>,
) {
  function useList() {
    return useQuery({ queryKey: [queryKey], queryFn: service.list });
  }

  function useDetail(id: string | undefined) {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: () => service.getById(id as string),
      enabled: Boolean(id),
    });
  }

  function useCreate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (input: Omit<T, "id">) => service.create(input),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    });
  }

  function useUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<T, "id">> }) =>
        service.update(id, patch),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    });
  }

  function useSetStatus() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, status }: { id: string; status: T["status"] }) =>
        service.setStatus(id, status),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    });
  }

  return { useList, useDetail, useCreate, useUpdate, useSetStatus };
}
