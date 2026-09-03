import nodemailer from 'nodemailer'

// Buat transporter Gmail sekali pakai
function createTransporter() {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    throw new Error('SMTP_USER dan SMTP_PASS wajib diisi di .env.local')
  }

  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   ?? 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT ?? '465', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth:   { user, pass },
  })
}

// Kirim email reset password
export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string,
): Promise<void> {
  const transporter = createTransporter()
  const from        = process.env.SMTP_FROM ?? process.env.SMTP_USER

  await transporter.sendMail({
    from,
    to:      toEmail,
    subject: 'Reset Password — Sistem Tunggakan PLN',
    html: `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F6FA;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6FA;padding:40px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:12px;overflow:hidden;
                    box-shadow:0 2px 12px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr>
          <td style="background:#1D4ED8;padding:28px 32px;text-align:center">
            <p style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:.5px">
              Sistem Tunggakan
            </p>
            <p style="margin:6px 0 0;color:#BFDBFE;font-size:13px">
              PLN — Perhitungan Data Tunggakan
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 16px;color:#374151;font-size:15px;font-weight:600">
              Permintaan Reset Password
            </p>
            <p style="margin:0 0 12px;color:#6B7280;font-size:14px;line-height:1.6">
              Kami menerima permintaan untuk mereset password akun kamu.
              Klik tombol di bawah untuk membuat password baru.
            </p>
            <p style="margin:0 0 24px;color:#6B7280;font-size:14px;line-height:1.6">
              Link ini berlaku selama <strong>1 jam</strong>.
              Jika kamu tidak meminta reset password, abaikan email ini.
            </p>

            <!-- Tombol -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
              <tr>
                <td style="background:#1D4ED8;border-radius:8px;text-align:center">
                  <a href="${resetUrl}"
                     style="display:inline-block;padding:12px 32px;color:#fff;
                            font-size:14px;font-weight:600;text-decoration:none;
                            letter-spacing:.3px">
                    Reset Password Sekarang
                  </a>
                </td>
              </tr>
            </table>

            <!-- Link alternatif -->
            <p style="margin:0 0 6px;color:#9CA3AF;font-size:12px">
              Atau salin link berikut ke browser:
            </p>
            <p style="margin:0;word-break:break-all">
              <a href="${resetUrl}"
                 style="color:#2563EB;font-size:12px;text-decoration:underline">
                ${resetUrl}
              </a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;
                     padding:16px 32px;text-align:center">
            <p style="margin:0;color:#9CA3AF;font-size:11px">
              © 2026 Sistem Tunggakan Pelanggan · PLN UID Sumatera Utara
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  })
}
