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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f5f5f5;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .header {
            background-color: #2c3e50;
            padding: 30px;
            text-align: center;
            color: white;
        }

        .header img {
            max-width: 180px;
            height: auto;
        }

        .content {
            padding: 40px 30px;
            text-align: center;
        }

        .title {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 20px 0;
        }

        .message {
            font-size: 16px;
            color: #666666;
            margin: 0 0 30px 0;
        }

        .code-container {
            background-color: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 6px;
            padding: 20px;
            margin: 0 0 30px 0;
        }

        .code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #2c3e50;
            margin: 0;
        }

        .footer {
            background-color: #2c3e50;
            font-size: 12px;
            color: white;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }

        .footer p {
            margin: 5px 0;
        }

        /* Mobile responsive */
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                border-radius: 0;
            }

            .content {
                padding: 30px 20px;
            }

            .code {
                font-size: 24px;
                letter-spacing: 2px;
            }
        }
    </style>
</head>
<body>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
        <td>
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <h1 class="title"><fmt:message key="jahia-upa.mfa.mail.title"/></h1>
                </div>

                <!-- Main Content -->
                <div class="content">
                    <p class="message">
                        <fmt:message key="jahia-upa.mfa.mail.message"/>:
                    </p>

                    <div class="code-container">
                        <p class="code">{{CODE}}</p>
                    </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <p style="margin-top: 10px;">
                        <%-- This JSP is rendered on the node of a module (/modules/user-password-authentication-api/<version>/contents/mfaMailCode), and not on a specific site.
                         Because of that, there is no "context" of site during the rendering and the URLs must be absolute : --%>
                        <img src="https://cdfoqfniea.cloudimg.io/https://www.jahia.com/modules/jahiacom-templates/images/jahia-3x.png" alt="Powered by Jahia">
                        <%-- it is not possible to use the usual syntax, for instance:
                        <img src="<c:url value="${url.server}${url.context}${url.currentModule}/path/to/your/image.png"/>">
                         --%>
                    </p>
                </div>
            </div>
        </td>
    </tr>
</table>
</body>
</html>
