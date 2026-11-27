import { UserActionDialog, type UserActionProps } from "./UserActionDialog";

export function UserRoleDialog(props: UserActionProps) {
  return <UserActionDialog {...props} kind="role" />;
}
