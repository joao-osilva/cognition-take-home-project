"use client";

import { useState, useTransition } from "react";

import type { ActionResult } from "@repo/core";
import { ALL_ROLES, type Role } from "@repo/core/rbac";
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from "@repo/ui";

import type { AdminUserRow } from "@/lib/admin";

export function UsersTable({
  users,
  onSetRoles,
}: {
  users: AdminUserRow[];
  onSetRoles: (clerkUserId: string, actorId: string, roles: Role[]) => Promise<ActionResult>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Roles</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.clerkUserId}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell className="text-muted-foreground">{user.email}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {user.roles.length ? (
                  user.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">no roles</span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <EditRolesDialog user={user} onSetRoles={onSetRoles} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EditRolesDialog({
  user,
  onSetRoles,
}: {
  user: AdminUserRow;
  onSetRoles: (clerkUserId: string, actorId: string, roles: Role[]) => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Role[]>(user.roles);
  const [pending, startTransition] = useTransition();

  const toggle = (role: Role, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, role] : prev.filter((r) => r !== role)));

  const save = () =>
    startTransition(async () => {
      const result = await onSetRoles(user.clerkUserId, user.actorId, selected);
      if (result.ok) {
        toast.success(`Roles updated for ${user.name}`);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setSelected(user.roles);
      }}
    >
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Edit roles
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit roles</DialogTitle>
          <DialogDescription>
            {user.name} ({user.email}) — approver roles imply the matching operator role; admin
            grants everything.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {ALL_ROLES.map((role) => (
            <Label key={role} className="flex items-center gap-2 font-normal">
              <Checkbox
                checked={selected.includes(role)}
                onCheckedChange={(checked) => toggle(role, checked === true)}
              />
              {role}
            </Label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            Save roles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
