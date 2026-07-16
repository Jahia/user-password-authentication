import org.jahia.settings.SettingsBean

import java.nio.file.Files
import java.nio.file.StandardCopyOption

def smtpServerUrl = new URI(System.getenv("SMTP_SERVER_URL"))

def etcDir = System.getProperty("karaf.etc")
if (etcDir == null || etcDir.isEmpty()) {
    etcDir = SettingsBean.getInstance().getJahiaVarDiskPath() + "/karaf/etc"
}
def mailCfg = new File(etcDir, "org.jahia.modules.mail.cfg")

def useSsl = smtpServerUrl.getScheme().equalsIgnoreCase("smtps")

def props = new Properties()
props.setProperty("smtp.host", smtpServerUrl.getHost())
props.setProperty("smtp.port", String.valueOf(smtpServerUrl.getPort()))
// Mailpit accepts unauthenticated plain SMTP, so no auth is required.
props.setProperty("smtp.auth", "false")
props.setProperty("smtp.starttls", "false")
props.setProperty("smtp.ssl", String.valueOf(useSsl))
props.setProperty("default.from", "noreply@smtp-server.localhost")

mailCfg.parentFile.mkdirs()
// Atomic write: stage to a temp file in the same directory, then atomically move it into place, so
// Felix fileinstall (watching karaf/etc) only ever sees the complete file, never a half-written one.
def tmp = File.createTempFile(".mail-setup", ".tmp", mailCfg.parentFile)
tmp.withOutputStream { out -> props.store(out, "Test SMTP configuration for Cypress tests") }
Files.move(tmp.toPath(), mailCfg.toPath(),
        StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE)
