using Microsoft.AspNetCore.Mvc;

namespace FleetService.Api.Controllers;

[ApiController]
[Route("health")]
public class HealthController : ControllerBase
{
    /// <summary>
    /// Health check endpoint for Docker/Kubernetes
    /// </summary>
    [HttpGet]
    public ActionResult<object> HealthCheck()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }
}