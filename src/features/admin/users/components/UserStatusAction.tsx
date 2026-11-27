import { UserActionDialog, type UserActionProps } from "./UserActionDialog";

export function UserStatusAction(props: UserActionProps) {
  return <UserActionDialog {...props} kind="status" />;
}
