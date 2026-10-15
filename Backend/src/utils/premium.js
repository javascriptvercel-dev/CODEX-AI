export const isPremiumUser = (user) =>
  Boolean(user?.premium_until && Date.parse(user.premium_until) > Date.now());
