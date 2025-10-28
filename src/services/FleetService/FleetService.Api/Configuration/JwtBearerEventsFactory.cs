using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.IdentityModel.Tokens.Jwt;

namespace FleetService.Api.Configuration;

public static class JwtBearerEventsFactory
{
    public static JwtBearerEvents CreateEvents() => new()
    {
        OnTokenValidated = OnTokenValidatedAsync,
        OnAuthenticationFailed = OnAuthenticationFailedAsync
    };

    private static Task OnTokenValidatedAsync(TokenValidatedContext context)
    {
        var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
        var token = context.SecurityToken as JwtSecurityToken;

        if (token is not null)
        {
            LogTokenValidationSuccess(logger, token);
        }

        return Task.CompletedTask;
    }

    private static Task OnAuthenticationFailedAsync(AuthenticationFailedContext context)
    {
        var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();

        logger.LogError(context.Exception, "JWT Authentication failed: {Error}", context.Exception.Message);

        LogFailedTokenDetails(logger, context.Request);

        return Task.CompletedTask;
    }

    private static void LogTokenValidationSuccess(ILogger logger, JwtSecurityToken token)
    {
        logger.LogInformation("JWT Token validated successfully:");
        logger.LogInformation("  Issuer: {Issuer}", token.Issuer);
        logger.LogInformation("  Audience: {Audience}", string.Join(", ", token.Audiences));
        logger.LogInformation("  Subject: {Subject}", token.Subject);
        logger.LogInformation("  KeyId: {KeyId}", token.Header.Kid);
        logger.LogInformation("  Claims: {Claims}",
            string.Join(", ", token.Claims.Select(c => $"{c.Type}={c.Value}")));
    }

    private static void LogFailedTokenDetails(ILogger logger, HttpRequest request)
    {
        var authHeader = request.Headers.Authorization.FirstOrDefault();
        if (authHeader?.StartsWith("Bearer ") != true)
            return;

        var tokenString = authHeader.Substring(7);
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var token = handler.ReadJwtToken(tokenString);

            logger.LogError("Failed token details:");
            logger.LogError("  Issuer: {Issuer}", token.Issuer);
            logger.LogError("  Audience: {Audience}", string.Join(", ", token.Audiences));
            logger.LogError("  Subject: {Subject}", token.Subject);
            logger.LogError("  KeyId: {KeyId}", token.Header.Kid);
            logger.LogError("  Expiry: {Expiry}", token.ValidTo);
            logger.LogError("  Claims: {Claims}",
                string.Join(", ", token.Claims.Select(c => $"{c.Type}={c.Value}")));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Could not parse JWT token for debugging");
        }
    }
}