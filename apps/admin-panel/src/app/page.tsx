import { client } from "#/lib/orpc";

export default async function Home() {
  const storeBrands = await client.storeBrands.getAll();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Store Brands</h2>

        {storeBrands.length === 0 ? (
          <p className="text-gray-500">No store brands found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {storeBrands.map((brand) => (
              <div
                key={String(brand.id)}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {String(brand.name)}
                    </h3>
                    <p className="text-sm text-gray-500">{String(brand.id)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
