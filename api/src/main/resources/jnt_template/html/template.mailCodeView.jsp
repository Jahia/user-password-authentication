<%@ page language="java" contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="template" uri="http://www.jahia.org/tags/templateLib" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="jcr" uri="http://www.jahia.org/tags/jcr" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%--@elvariable id="currentNode" type="org.jahia.services.content.JCRNodeWrapper"--%>
<%--@elvariable id="out" type="java.io.PrintWriter"--%>
<%--@elvariable id="script" type="org.jahia.services.render.scripting.Script"--%>
<%--@elvariable id="scriptInfo" type="java.lang.String"--%>
<%--@elvariable id="workspace" type="java.lang.String"--%>
<%--@elvariable id="renderContext" type="org.jahia.services.render.RenderContext"--%>
<%--@elvariable id="currentResource" type="org.jahia.services.render.Resource"--%>
<%--@elvariable id="url" type="org.jahia.services.render.URLGenerator"--%>

<%-- In order to allows cache flush to happens correctly when a site installed module is start/stop --%>
<c:set var="ignored" value="${renderContext.mainResource.dependencies.add(renderContext.site.path)}" />

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="x-apple-disable-message-reformatting" />
    <title><fmt:message key="jahia-upa.mfa.mail.title"/></title>
    <style type="text/css">
        /* Reset styles */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }

        /* Main styles */
        body {
            font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #293136;
            background-color: #F6FAFC;
        }

        .container {
            width: 100%;
            max-width: 486px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 4px;
            box-shadow: 0px 4px 8px rgba(19, 28, 33, 0.08);
        }

        .content-padding {
            padding: 32px;
        }

        .logo {
            text-align: center;
            margin-bottom: 40px;
        }

        .logo a {
            text-decoration: none;
        }

        .logo img {
            max-height: 70px;
            width: auto;
            display: block;
        }

        .logo-crop {
            width: 130px;
            height: 70px;
            overflow: hidden;
            display: inline-block;
        }

        .logo-crop img {
            height: 70px;
            margin-left: -123px;
            display: block;
            max-width: none;
        }

        .message {
            font-size: 14px;
            color: #293136;
            margin: 0 0 24px 0;
        }

        .code-container {
            background-color: #F6F6F6;
            padding: 24px;
            text-align: center;
            margin-bottom: 24px;
        }

        .code {
            font-family: 'Roboto Mono', 'Courier New', Courier, monospace;
            font-size: 28px;
            font-weight: 700;
            color: #293136;
            margin: 0;
            line-height: 26px;
        }

        .validity {
            text-align: center;
            font-size: 14px;
            color: #293136;
            margin-bottom: 40px;
        }

        .footer-title {
            font-size: 16px;
            font-weight: 700;
            color: #00A0E3;
            margin-bottom: 8px;
        }

        .footer-text {
            font-size: 14px;
            color: #293136;
        }

        a {
            color: #00A0E3;
            text-decoration: underline;
        }

        /* Mobile responsive */
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                border-radius: 0;
            }

            .content-padding {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F6FAFC; padding: 24px;">
    <tr>
        <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" class="container">
                <tr>
                    <td class="content-padding">
                        <!-- Logo -->
                        <div class="logo">
                            <%-- This JSP is rendered on the node of a module (/modules/user-password-authentication-api/<version>/contents/mfaMailCode), and not on a specific site.
                             Because of that, there is no "context" of site during the rendering and the URLs must be absolute : --%>
                            <a href="https://jahia.cloud">
                                <div class="logo-crop">
                                    <img src="https://jahia.cloud/modules/dx-jelastic-template/media/jahia-cloud-logo.svg" alt="Jahia" height="70">
                                    <%-- it is not possible to use the usual syntax, for instance:
                        <img src="<c:url value="${url.server}${url.context}${url.currentModule}/path/to/your/image.png"/>">
                         --%>
                                </div>
                            </a>
                        </div>

                        <!-- Main Content -->
                        <div class="message"><fmt:message key="jahia-upa.mfa.mail.message"/></div>

                        <div class="code-container">
                            <p class="code">{{CODE}}</p>
                        </div>

                        <div class="validity"><fmt:message key="jahia-upa.mfa.mail.validity"/></div>

                        <div class="footer-title"><fmt:message key="jahia-upa.mfa.mail.notRequested.title"/></div>

                        <div class="footer-text"><fmt:message key="jahia-upa.mfa.mail.notRequested.message"/></div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
