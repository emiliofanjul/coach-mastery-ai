// Botones para compartir la invitación al equipo: WhatsApp, correo (desde la
// app de correo del manager) y copiar. Se usa al final del onboarding y en Mi
// Empresa. Ver src/lib/invitacion.ts.
import { useState } from "react";
import {
  ligaDeInvitacion,
  mensajeDeInvitacion,
  ligaWhatsApp,
  ligaCorreo,
  ASUNTO_CORREO,
} from "@/lib/invitacion";

export function CompartirInvitacion({
  codigo,
  empresa,
  vence,
}: {
  codigo: string;
  empresa: string;
  vence?: string | null;
}) {
  const [copiado, setCopiado] = useState(false);
  const origen = typeof window !== "undefined" ? window.location.origin : "";
  const liga = ligaDeInvitacion(origen, codigo);
  const mensaje = mensajeDeInvitacion(empresa, liga, codigo, vence);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* el navegador no dejó copiar */
    }
  };

  const boton: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderRadius: 99,
    border: "1px solid #252535",
    background: "transparent",
    color: "#F0F0F5",
    fontFamily: "DM Sans",
    fontWeight: 600,
    fontSize: "0.8rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
  };

  return (
    <div>
      <a
        href={ligaWhatsApp(mensaje)}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...boton, width: "100%", background: "#25D366", border: "none", color: "#08080F" }}
      >
        Compartir por WhatsApp
      </a>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <a href={ligaCorreo(ASUNTO_CORREO, mensaje)} style={boton}>
          Enviar por correo
        </a>
        <button
          type="button"
          onClick={copiar}
          style={{ ...boton, color: copiado ? "#06D6A0" : "#F0F0F5" }}
        >
          {copiado ? "✓ Copiada" : "Copiar invitación"}
        </button>
      </div>
      <p style={{ fontSize: "0.72rem", color: "#5A5A8A", marginTop: 8, lineHeight: 1.4 }}>
        La invitación lleva una liga con el código ya puesto: tu vendedor solo crea su cuenta. El
        correo sale desde tu propia cuenta, para que lo reciba de ti.
      </p>
    </div>
  );
}
