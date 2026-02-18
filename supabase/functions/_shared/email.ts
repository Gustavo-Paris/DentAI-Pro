// Shared email infrastructure for ToSmile.ai edge functions
// Uses Resend (https://resend.com) for transactional + marketing emails

import { Resend } from "npm:resend";
import { logger } from "./logger.ts";

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      throw new Error("RESEND_API_KEY not set");
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

const DEFAULT_FROM = "ToSmile.ai <noreply@tosmile.ai>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const resend = getResend();

  const { error } = await resend.emails.send({
    from: options.from ?? DEFAULT_FROM,
    to: [options.to],
    subject: options.subject,
    html: options.html,
    reply_to: options.replyTo,
  });

  if (error) {
    logger.error("Resend send error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  logger.log(`Email sent to ${options.to} — subject: "${options.subject}"`);
}

// ---------------------------------------------------------------------------
// Shared layout
// ---------------------------------------------------------------------------

const TEAL = "#2A9D8F";
const DARK = "#1A1A2E";
const GRAY_TEXT = "#555555";

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ToSmile.ai</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:${DARK};padding:24px 32px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:${TEAL};letter-spacing:2px;">ToSmile.ai</h1>
              <p style="margin:4px 0 0;font-size:12px;color:#a0a0b0;letter-spacing:1px;">ODONTOLOGIA DIGITAL INTELIGENTE</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:20px 32px;border-top:1px solid #e5e5e5;">
              <p style="margin:0 0 8px;font-size:12px;color:#999;text-align:center;">
                ToSmile.ai &mdash; Odontologia Digital Inteligente
              </p>
              <p style="margin:0;font-size:11px;color:#bbb;text-align:center;">
                Voce recebeu este e-mail porque possui uma conta no ToSmile.ai.<br>
                <a href="https://tosmile.ai/settings" style="color:${TEAL};text-decoration:underline;">Gerenciar preferencias</a>
                &nbsp;|&nbsp;
                <a href="https://tosmile.ai/settings" style="color:${TEAL};text-decoration:underline;">Cancelar inscricao</a>
              </p>
              <p style="margin:8px 0 0;font-size:10px;color:#ccc;text-align:center;">
                Em conformidade com a LGPD (Lei 13.709/2018).
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Template: Welcome
// ---------------------------------------------------------------------------

export function welcomeEmail(name: string): { subject: string; html: string } {
  const firstName = name.split(" ")[0];
  return {
    subject: "Bem-vindo(a) ao ToSmile.ai!",
    html: layout(`
      <h2 style="margin:0 0 16px;font-size:22px;color:${DARK};">Ola, ${firstName}!</h2>
      <p style="margin:0 0 16px;font-size:15px;color:${GRAY_TEXT};line-height:1.6;">
        Sua conta no <strong style="color:${TEAL};">ToSmile.ai</strong> foi criada com sucesso.
        Agora voce tem acesso a inteligencia clinica que vai transformar suas restauracoes.
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:${GRAY_TEXT};line-height:1.6;">
        Comece agora mesmo: cadastre suas resinas, crie sua primeira avaliacao e receba
        protocolos de estratificacao personalizados com IA.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
        <tr>
          <td style="background-color:${TEAL};border-radius:6px;">
            <a href="https://tosmile.ai/dashboard" style="display:inline-block;padding:12px 32px;font-size:15px;font-weight:600;color:${DARK};text-decoration:none;">
              Acessar meu painel
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:24px 0 0;font-size:13px;color:#999;line-height:1.5;">
        Duvidas? Responda este e-mail ou acesse nossas configuracoes.
      </p>
    `),
  };
}

// ---------------------------------------------------------------------------
// Template: Credit Warning (low credits)
// ---------------------------------------------------------------------------

export function creditWarningEmail(
  name: string,
  remaining: number,
  total: number,
): { subject: string; html: string } {
  const firstName = name.split(" ")[0];
  const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
  return {
    subject: `Alerta: ${remaining} credito(s) restante(s) no ToSmile.ai`,
    html: layout(`
      <h2 style="margin:0 0 16px;font-size:22px;color:${DARK};">Ola, ${firstName}</h2>
      <p style="margin:0 0 16px;font-size:15px;color:${GRAY_TEXT};line-height:1.6;">
        Voce esta usando <strong>${pct}%</strong> dos seus creditos.
        Restam <strong style="color:#e74c3c;">${remaining}</strong> de ${total} creditos disponiveis.
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:${GRAY_TEXT};line-height:1.6;">
        Para continuar recebendo protocolos de estratificacao e recomendacoes de resina,
        garanta seus creditos antes que acabem.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
        <tr>
          <td style="background-color:${TEAL};border-radius:6px;">
            <a href="https://tosmile.ai/settings" style="display:inline-block;padding:12px 32px;font-size:15px;font-weight:600;color:${DARK};text-decoration:none;">
              Adicionar creditos
            </a>
          </td>
        </tr>
      </table>
    `),
  };
}

// ---------------------------------------------------------------------------
// Template: Weekly Digest
// ---------------------------------------------------------------------------

interface WeeklyStats {
  casesThisWeek: number;
  totalCases: number;
  pendingTeeth: number;
}

export function weeklyDigestEmail(
  name: string,
  stats: WeeklyStats,
): { subject: string; html: string } {
  const firstName = name.split(" ")[0];
  return {
    subject: "Seu resumo semanal ToSmile.ai",
    html: layout(`
      <h2 style="margin:0 0 16px;font-size:22px;color:${DARK};">Ola, ${firstName}</h2>
      <p style="margin:0 0 20px;font-size:15px;color:${GRAY_TEXT};line-height:1.6;">
        Veja o resumo da sua semana no <strong style="color:${TEAL};">ToSmile.ai</strong>:
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
        <tr>
          <td width="33%" style="text-align:center;padding:16px 8px;background-color:#fafafa;border-radius:6px;">
            <p style="margin:0;font-size:28px;font-weight:700;color:${TEAL};">${stats.casesThisWeek}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">Casos esta semana</p>
          </td>
          <td width="33%" style="text-align:center;padding:16px 8px;background-color:#fafafa;border-radius:6px;">
            <p style="margin:0;font-size:28px;font-weight:700;color:${TEAL};">${stats.totalCases}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">Total de casos</p>
          </td>
          <td width="33%" style="text-align:center;padding:16px 8px;background-color:#fafafa;border-radius:6px;">
            <p style="margin:0;font-size:28px;font-weight:700;color:${TEAL};">${stats.pendingTeeth}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">Dentes pendentes</p>
          </td>
        </tr>
      </table>
      ${stats.pendingTeeth > 0
        ? `<p style="margin:0 0 24px;font-size:15px;color:${GRAY_TEXT};line-height:1.6;">
            Voce tem <strong>${stats.pendingTeeth} dente(s)</strong> aguardando avaliacao.
            Continue de onde parou!
          </p>`
        : `<p style="margin:0 0 24px;font-size:15px;color:${GRAY_TEXT};line-height:1.6;">
            Otimo trabalho! Todos os dentes estao avaliados.
          </p>`
      }
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
        <tr>
          <td style="background-color:${TEAL};border-radius:6px;">
            <a href="https://tosmile.ai/dashboard" style="display:inline-block;padding:12px 32px;font-size:15px;font-weight:600;color:${DARK};text-decoration:none;">
              Ir para o painel
            </a>
          </td>
        </tr>
      </table>
    `),
  };
}

// ---------------------------------------------------------------------------
// Template: Account Deleted
// ---------------------------------------------------------------------------

export function accountDeletedEmail(name: string): { subject: string; html: string } {
  const firstName = name.split(" ")[0];
  return {
    subject: "Sua conta ToSmile.ai foi excluida",
    html: layout(`
      <h2 style="margin:0 0 16px;font-size:22px;color:${DARK};">Ola, ${firstName}</h2>
      <p style="margin:0 0 16px;font-size:15px;color:${GRAY_TEXT};line-height:1.6;">
        Confirmamos que sua conta no <strong style="color:${TEAL};">ToSmile.ai</strong> e todos os dados
        associados foram excluidos permanentemente, conforme solicitado.
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:${GRAY_TEXT};line-height:1.6;">
        Esta acao esta em conformidade com o Artigo 18, VI da LGPD (Lei 13.709/2018)
        &mdash; direito a eliminacao dos dados pessoais.
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:${GRAY_TEXT};line-height:1.6;">
        Sentiremos sua falta! Se mudar de ideia no futuro, voce pode criar uma nova
        conta a qualquer momento.
      </p>
      <p style="margin:0;font-size:13px;color:#999;line-height:1.5;">
        Este e o ultimo e-mail que voce recebera de nos.
      </p>
    `),
  };
}
