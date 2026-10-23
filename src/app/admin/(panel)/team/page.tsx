import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { Flash, PageHeader, Table } from "@/components/admin/ui";
import { addUserAction, changePasswordAction, updateUserAction } from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import type { User } from "@/lib/types";
import { fmtDate } from "@/lib/util";

export const metadata = { title: "Team" };

const ROLES = [
  ["admin", "Admin — everything: events, tickets, orders, money, team"],
  ["editor", "Editor — articles, mailing list & email campaigns"],
  ["door", "Door — check-in scanner only"],
] as const;

export default async function Team({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await requireUser(["admin"]);
  const { error } = await searchParams;
  const users = await all<User>("SELECT id, email, name, role, created_at FROM users ORDER BY id");
  return (
    <>
      <PageHeader title="Team" subtitle="Give organisers, writers and door staff their own logins." />
      <Flash error={error} />
      <Table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Added</th><th></th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="font-semibold">{u.name}{u.id === me.id && <span className="ml-2 text-xs text-white/40">(you)</span>}</td>
              <td className="text-white/70">{u.email}</td>
              <td>
                <form action={updateUserAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="op" value="role" />
                  <select name="role" defaultValue={u.role} className="input !w-28 !py-1 text-xs">
                    {ROLES.map(([r]) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <SubmitButton className="text-xs text-gold hover:underline">Save</SubmitButton>
                </form>
              </td>
              <td className="text-white/50">{fmtDate(u.created_at, { weekday: undefined })}</td>
              <td className="text-right">
                {u.id !== me.id && (
                  <form action={updateUserAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <SubmitButton name="op" value="delete" className="text-xs text-red-400 hover:underline" confirm={`Remove ${u.name}'s access?`}>Remove</SubmitButton>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-bold text-white">Add team member</h2>
          <ActionForm action={addUserAction} className="mt-4 space-y-3" resetOnSuccess>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Name</label><input name="name" required className="input" /></div>
              <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
            </div>
            <div>
              <label className="label">Role</label>
              <select name="role" defaultValue="editor" className="input">{ROLES.map(([r, d]) => <option key={r} value={r}>{d}</option>)}</select>
            </div>
            <div><label className="label">Temporary password (optional — auto-generated if empty)</label><input name="password" className="input" minLength={8} /></div>
            <SubmitButton>Add member</SubmitButton>
          </ActionForm>
        </div>
        <div className="card p-5">
          <h2 className="font-bold text-white">Change my password</h2>
          <ActionForm action={changePasswordAction} className="mt-4 space-y-3" resetOnSuccess>
            <div><label className="label">New password</label><input name="password" type="password" required minLength={8} className="input" autoComplete="new-password" /></div>
            <SubmitButton>Update password</SubmitButton>
          </ActionForm>
        </div>
      </div>
    </>
  );
}
