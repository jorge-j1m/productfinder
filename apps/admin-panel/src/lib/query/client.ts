import { QueryClient } from "@tanstack/react-query";
import { serializer } from "../serializer";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn(queryKey) {
          const [json, meta] = serializer.serialize(queryKey);
          return JSON.stringify({ json, meta });
        },
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}
