export const isPremiumUser = (user) =>
  user?.role === "admin" ||
  Boolean(user?.premium_until && Date.parse(user.premium_until) > Date.now());
