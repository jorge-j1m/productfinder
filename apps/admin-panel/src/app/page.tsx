import { getQueryClient, HydrateClient } from "#/lib/query/hydration";
import { orpc } from "#/lib/query/orpc";
import { ListStoreBrands } from "#/components/list_store_brands";

export default function Home() {
  const queryClient = getQueryClient();

  queryClient.prefetchQuery(orpc.storeBrands.getAll.queryOptions());

  return (
    <HydrateClient client={queryClient}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        <ListStoreBrands />
      </div>
    </HydrateClient>
  );
}
