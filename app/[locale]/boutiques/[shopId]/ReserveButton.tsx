"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { reserveDevice } from "@/app/actions/requests";

interface Props {
  deviceId: string;
  respondingShopId: string;
  priceEur: number | null;
  label: string;
  locale: string;
}

export default function ReserveButton({ deviceId, respondingShopId, priceEur, label, locale }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  function handleClick() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    startTransition(async () => {
      const result = await reserveDevice({
        device_id: deviceId,
        responding_shop_id: respondingShopId,
        price_eur: priceEur,
        locale,
      });
      if (result && "error" in result) {
        const msgs: Record<string, string> = {
          self_reserve: "Vous ne pouvez pas réserver chez vous-même.",
          rate_limit: "Trop de demandes actives. Attendez un peu.",
          no_session: "Session expirée, reconnectez-vous.",
          no_shop: "Aucune boutique liée à ce compte.",
          forbidden: "Accès refusé.",
        };
        toast.error(msgs[result.error] ?? "Erreur lors de la réservation.");
        setConfirmed(false);
      }
      // redirect() inside server action navigates away on success
    });
  }

  if (confirmed) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setConfirmed(false)}
          className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleClick}
          disabled={pending}
          className="flex-1 px-4 py-2 text-xs font-bold text-white bg-brand-500 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
        >
          {pending ? (
            <>
              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Réservation…
            </>
          ) : (
            <>✓ Confirmer</>
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-full px-4 py-2 text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 rounded-xl hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all"
    >
      {label}
    </button>
  );
}
