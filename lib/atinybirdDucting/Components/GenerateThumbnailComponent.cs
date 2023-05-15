using System.Data.Entity.Migrations.Model;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using atinybirdDucting.Artifacts;
using ductwork.Artifacts;
using ductwork.Components;
using ductwork.Crates;
using ductwork.Executors;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Webp;

#nullable enable
namespace atinybirdDucting.Components;

public class GenerateThumbnailComponent : SingleInSingleOutComponent
{
    public Setting<Size> Size = new Size(240, 160);

    private const string TargetPathExtension = "webp";
    private static readonly IImageEncoder Encoder = new WebpEncoder();

    protected override async Task ExecuteIn(IExecutor executor, ICrate crate, CancellationToken token)
    {
        if (crate.Get<ISourcePathArtifact>() is not { } sourcePathArtifact ||
            crate.Get<ITargetPathArtifact>() is not { } targetPathArtifact)
        {
            return;
        }

        var thumbnailArtifact = new ThumbnailArtifact(sourcePathArtifact.SourcePath, Encoder, Size);

        if (!await thumbnailArtifact.IsSourcePathValidImage(token))
        {
            return;
        }

        var targetPath = Path.Combine(
            Path.GetDirectoryName(targetPathArtifact.TargetPath) ?? string.Empty,
            ".thumb",
            $"{Path.GetFileNameWithoutExtension(targetPathArtifact.TargetPath)}.{TargetPathExtension}");

        await executor.Push(
            Out,
            executor.CreateCrate(
                crate,
                thumbnailArtifact,
                new TargetPathArtifact(targetPath)));
    }
}