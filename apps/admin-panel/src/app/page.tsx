import { newStoreBrandSchema } from "@repo/database";

export default function Home() {
  const sb = {
    name: "Test",
    logo: "https://example.com/logo.png",
  };

  const parsed = newStoreBrandSchema.parse(sb);
  console.log(parsed);

  return (
    <>
      <div>Admin Panel</div>
      {JSON.stringify(parsed)}
    </>
  );
}
