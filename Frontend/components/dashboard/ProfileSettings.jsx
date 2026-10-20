"use client";
import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, LogOut, MailCheck } from "lucide-react";
import Avatar from "@/components/layout/Avatar";
import Button from "@/components/ui/Button";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast";

const cardClass = "rounded-xl border border-edge bg-surface p-5 sm:p-6";
const fieldClass =
  "focus-ring w-full rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm text-fg outline-none";

function Notice({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/5 p-3 text-sm text-red-400">
      {children}
    </p>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <label htmlFor={id} className="block text-sm">
      <span className="mb-1.5 block text-muted">{label}</span>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className={`${fieldClass} pr-10`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="focus-ring absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:text-fg"
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </label>
  );
}

/**
 * Profile, security and sign-out controls. Shared by the user dashboard
 * (Settings section) and the admin console (Settings tab) so both get the
 * same behaviour — profile photos live only in those two places.
 */
export default function ProfileSettings() {
  const { user, refresh, logout, isAdmin } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const profileChanged =
    fullName.trim() !== (user.fullName || "") ||
    email.trim().toLowerCase() !== user.email;

  async function saveProfile(event) {
    event.preventDefault();
    setProfileError("");
    setProfileBusy(true);
    try {
      const result = await api.updateProfile({ fullName: fullName.trim(), email: email.trim() });
      await refresh();
      if (result.confirmationSentTo) {
        // The email only changes once the link is opened, so keep showing the current one.
        setEmail(user.email);
        showToast(`Confirmation link sent to ${result.confirmationSentTo}.`);
      } else {
        showToast("Profile updated.");
      }
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setProfileBusy(false);
    }
  }

  async function cancelEmailChange() {
    setCancelBusy(true);
    setProfileError("");
    try {
      await api.cancelEmailChange();
      await refresh();
      showToast("Email change cancelled.");
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setCancelBusy(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError("Your new password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords don't match.");
      return;
    }
    setPasswordBusy(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await refresh();
      showToast("Password changed. Other devices were signed out.");
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <div className="space-y-6">
      <section className={cardClass} aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="font-display text-lg font-bold">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          <Avatar size={72} />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
              {user.fullName || user.email}
              {isAdmin && <VerifiedBadge size={15} label="Verified administrator" />}
            </p>
            <p className="mt-0.5 text-xs text-muted">Click your photo to change it. Images up to 2 MB.</p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label htmlFor="profile-name" className="block text-sm">
            <span className="mb-1.5 block text-muted">Name</span>
            <input
              id="profile-name"
              name="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              maxLength={80}
              autoComplete="name"
              className={fieldClass}
            />
          </label>
          <label htmlFor="profile-email" className="block text-sm">
            <span className="mb-1.5 block text-muted">Email</span>
            <input
              id="profile-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className={fieldClass}
            />
          </label>
          <div className="space-y-3 sm:col-span-2">
            {user.pendingEmail && (
              <div className="flex flex-col gap-3 rounded-lg border border-azure-500/30 bg-azure-500/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-muted">
                  <MailCheck size={16} className="mt-0.5 flex-none text-azure-500" aria-hidden="true" />
                  <span className="[overflow-wrap:anywhere]">
                    Check <strong className="text-fg">{user.pendingEmail}</strong> for a confirmation link. Your email stays{" "}
                    {user.email} until you confirm.
                  </span>
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={cancelEmailChange} disabled={cancelBusy}>
                  Cancel change
                </Button>
              </div>
            )}
            <Notice>{profileError}</Notice>
            <Button type="submit" disabled={profileBusy || !profileChanged}>
              {profileBusy && <LoaderCircle size={15} className="animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </section>

      <section className={cardClass} aria-labelledby="password-heading">
        <h2 id="password-heading" className="font-display text-lg font-bold">Password</h2>
        <p className="mt-1 text-sm text-muted">
          Changing your password signs you out on all other devices.
        </p>
        <form onSubmit={savePassword} className="mt-5 grid max-w-xl gap-4">
          <PasswordField
            id="current-password"
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />
          <PasswordField
            id="new-password"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
          <Notice>{passwordError}</Notice>
          <div>
            <Button type="submit" disabled={passwordBusy || !newPassword}>
              {passwordBusy && <LoaderCircle size={15} className="animate-spin" />}
              Change password
            </Button>
          </div>
        </form>
      </section>

      <section className={`${cardClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <h2 className="font-display text-lg font-bold">Sign out</h2>
          <p className="mt-1 text-sm text-muted">End your session on this device.</p>
        </div>
        <Button variant="secondary" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? <LoaderCircle size={15} className="animate-spin" /> : <LogOut size={15} />}
          Log out
        </Button>
      </section>
    </div>
  );
}
