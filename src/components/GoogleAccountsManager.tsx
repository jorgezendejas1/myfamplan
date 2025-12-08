import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { LogIn, LogOut, RefreshCw, Mail } from "lucide-react";
import {
  getGoogleAuthUrl,
  getConnectedAccounts,
  disconnectAccount,
  toggleSyncEnabled,
  syncFromGoogle,
  type GoogleAccount,
} from "@/services/googleSyncService";

interface GoogleAccountsManagerProps {
  onEventsImported?: (events: any[]) => void;
}

export function GoogleAccountsManager({ onEventsImported }: GoogleAccountsManagerProps) {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadAccounts();

    // Check for OAuth callback result
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("google_auth_success");
    const error = urlParams.get("google_auth_error");
    const email = urlParams.get("email");

    if (success) {
      toast.success(`Cuenta conectada: ${email}`);
      loadAccounts();
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      toast.error(`Error de autenticación: ${error}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function loadAccounts() {
    setLoading(true);
    const data = await getConnectedAccounts();
    setAccounts(data);
    setLoading(false);
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const authUrl = await getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error connecting:", error);
      toast.error("Error al iniciar conexión con Google");
      setConnecting(false);
    }
  }

  async function handleDisconnect(accountId: string) {
    const success = await disconnectAccount(accountId);
    if (success) {
      toast.success("Cuenta desconectada");
      loadAccounts();
    } else {
      toast.error("Error al desconectar cuenta");
    }
  }

  async function handleToggleSync(accountId: string, enabled: boolean) {
    const success = await toggleSyncEnabled(accountId, enabled);
    if (success) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, sync_enabled: enabled } : acc
        )
      );
      toast.success(enabled ? "Sincronización activada" : "Sincronización desactivada");
    } else {
      toast.error("Error al cambiar sincronización");
    }
  }

  async function handleSync(accountId: string) {
    setSyncing(accountId);
    try {
      const events = await syncFromGoogle(accountId);
      if (onEventsImported) {
        onEventsImported(events);
      }
      toast.success(`${events.length} eventos sincronizados`);
      loadAccounts();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Error al sincronizar");
    } finally {
      setSyncing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Cuentas de Google Calendar</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="mr-2 h-4 w-4" />
          )}
          Conectar cuenta
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Mail className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No hay cuentas de Google conectadas
          </p>
          <p className="text-xs text-muted-foreground">
            Conecta tu cuenta para sincronizar eventos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{account.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {account.last_sync_at
                      ? `Última sync: ${new Date(account.last_sync_at).toLocaleString("es")}`
                      : "Nunca sincronizado"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={account.sync_enabled}
                  onCheckedChange={(checked) => handleToggleSync(account.id, checked)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSync(account.id)}
                  disabled={syncing === account.id || !account.sync_enabled}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${syncing === account.id ? "animate-spin" : ""}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDisconnect(account.id)}
                >
                  <LogOut className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
