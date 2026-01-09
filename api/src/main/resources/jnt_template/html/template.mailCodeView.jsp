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
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; width: 100%; height: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; color: #293136; background-color: #F6FAFC;">

<!-- Wrapper Table -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F6FAFC;">
    <tr>
        <td align="center" style="padding: 24px;">

            <!--[if mso]>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="486" align="center">
            <tr>
            <td>
            <![endif]-->

            <!-- Container Table -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 486px; background-color: #ffffff; border: 1px solid #e0e0e0; box-shadow: 0px 4px 8px rgba(19, 28, 33, 0.08);">
                <tr>
                    <td style="padding: 32px;">

                        <!-- Logo -->
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                                <td align="center" style="padding-bottom: 40px;">
                                    <%-- This JSP is rendered on the node of a module (/modules/user-password-authentication-api/<version>/contents/mfaMailCode), and not on a specific site.
                                     Because of that, there is no "context" of site during the rendering and the URLs must be absolute : --%>
                                    <a href="https://jahia.cloud" style="text-decoration: none;">
                                        <%-- it is not possible to use the usual syntax, for instance:
                                        <img src="<c:url value="${url.server}${url.context}${url.currentModule}/path/to/your/image.png"/>">
                                         --%>
                                        <img src="https://jahia.cloud/modules/dx-jelastic-template/media/jahia-cloud-logo-small.png"
                                             alt="Jahia"
                                             width="155"
                                             height="70"
                                             style="display: block; border: 0; outline: none; text-decoration: none;" />
                                    </a>
                                </td>
                            </tr>
                        </table>

                        <!-- Main Content -->
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <!-- Message -->
                            <tr>
                                <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #293136; line-height: 1.6; padding-bottom: 24px;">
                                    <fmt:message key="jahia-upa.mfa.mail.message"/>
                                </td>
                            </tr>

                            <!-- Code Container -->
                            <tr>
                                <td style="padding-bottom: 24px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tr>
                                            <td align="center" style="background-color: #F6F6F6; padding: 24px;">
                                                <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 700; color: #293136; line-height: 26px;">{{CODE}}</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Validity -->
                            <tr>
                                <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #293136; padding-bottom: 40px;">
                                    <fmt:message key="jahia-upa.mfa.mail.validity"/>
                                </td>
                            </tr>

                            <!-- Footer Title -->
                            <tr>
                                <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: #00A0E3; padding-bottom: 8px;">
                                    <fmt:message key="jahia-upa.mfa.mail.notRequested.title"/>
                                </td>
                            </tr>

                            <!-- Footer Text -->
                            <tr>
                                <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #293136; line-height: 1.6;">
                                    <fmt:message key="jahia-upa.mfa.mail.notRequested.message"/>
                                </td>
                            </tr>

                        </table>

                    </td>
                </tr>
            </table>

            <!--[if mso]>
            </td>
            </tr>
            </table>
            <![endif]-->

        </td>
    </tr>
</table>

</body>
</html>
