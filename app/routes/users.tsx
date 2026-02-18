import { supabaseServer  } from "~/lib/supabase.server";
import { useLoaderData } from "react-router";

export async function loader() {
  const { data, error } = await supabaseServer
    .from("users")
    .select("*");

  if (error) throw new Error(error.message);

  return data;
}

export default function Users() {
  const users = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Users</h1>
      {users.map((u: any) => (
        <div key={u.id}>{u.name}, {u.email}</div>
      ))}
    </div>
  );
}
