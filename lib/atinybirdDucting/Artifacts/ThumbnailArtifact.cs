using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using ductwork.Artifacts;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

#nullable enable
namespace atinybirdDucting.Artifacts
{
    public class ThumbnailArtifact : Artifact
    {
        public readonly string SourcePath;
        public readonly string TargetPath;
        public readonly Size Size;

        public ThumbnailArtifact(string sourcePath, string targetPath, Size? size = null)
        {
            SourcePath = sourcePath;
            TargetPath = targetPath;
            Size = size ?? new Size(240, 160);
            
            var info = new FileInfo(SourcePath);
            ContentId = $"{info.Length};{info.LastWriteTimeUtc};{Size.Width}x{Size.Height}";
        }

        public override string Id => TargetPath;
        
        public override string ContentId { get; }
        
        public override bool RequiresFinalize()
        {
            if (!File.Exists(TargetPath))
            {
                return true;
            }
            
            var sourceInfo = new FileInfo(SourcePath);
            var targetInfo = new FileInfo(TargetPath);

            return sourceInfo.LastWriteTimeUtc != targetInfo.LastWriteTimeUtc;
        }

        public override async Task<bool> Finalize(CancellationToken token)
        {
            var dir = Path.GetDirectoryName(TargetPath);

            if (dir != null)
            {
                Directory.CreateDirectory(dir);
            }

            var sourceInfo = new FileInfo(SourcePath);
            

            if (!Directory.Exists(SourcePath) && File.Exists(SourcePath))
            {
                try
                {
                    var sourceImage = await Image.LoadAsync(SourcePath, token);
                    var (width, height) = sourceImage.Width > sourceImage.Height
                        ? new Size(Math.Min(sourceImage.Width, Size.Width), 0)
                        : new Size(0, Math.Min(sourceImage.Height, Size.Height));

                    sourceImage.Mutate(x => x.Resize(width, height, KnownResamplers.Robidoux));

                    await sourceImage.SaveAsync(TargetPath, token);
                }
                catch (ArgumentOutOfRangeException)
                {
                    // Image dimensions larger than int64.
                    throw new InvalidOperationException("Image is too large to load.");
                }
                catch (UnknownImageFormatException)
                {
                }
            }

            if (!File.Exists(TargetPath))
            {
                return false;
            }
            
            File.SetLastWriteTimeUtc(TargetPath, sourceInfo.LastWriteTimeUtc);
            
            return true;
        }
    }
}