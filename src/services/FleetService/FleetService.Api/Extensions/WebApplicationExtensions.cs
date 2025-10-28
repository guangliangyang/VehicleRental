
namespace FleetService.Api.Extensions;

public static class WebApplicationExtensions
{
    /// <summary>
    /// Configures middleware pipeline for development and production environments
    /// </summary>
    public static WebApplication ConfigureMiddleware(this WebApplication app)
    {
        // Enable CORS
        app.UseCors("AllowFrontend");

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        // Authentication and Authorization middleware
        app.UseAuthentication();
        app.UseAuthorization();

        return app;
    }




    /// <summary>
    /// Initializes required services on startup
    /// </summary>
    public static async Task<WebApplication> InitializeServicesAsync(this WebApplication app)
    {
        // Azure resources are assumed to be created via IaC (Terraform/ARM)
        // No runtime initialization needed
        await Task.CompletedTask;
        return app;
    }

}