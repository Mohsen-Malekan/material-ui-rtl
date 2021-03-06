import React from "react";
import User from "./User";
import { useAccess, TUser } from ".";

const Users = () => {
  const [state, actions] = useAccess();
  const { users } = state;

  const handleDelete = (user: TUser) => {
    // user.loading = true;
    actions.unSubscribe(user);
  };

  return (
    <div style={{ maxHeight: 500, overflow: "auto" }}>
      {users.map(user => (
        <User key={user.id} user={user} onDelete={handleDelete} />
      ))}
    </div>
  );
};

export default Users;
