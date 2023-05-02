using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using ductwork.Artifacts;
using Force.Crc32;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

#nullable enable
namespace atinybirdDucting.Artifacts
{
    public class ThumbnailArtifact : Artifact, IFilePathArtifact, ITargetFilePathArtifact, IFinalizingArtifact
    {
        public ThumbnailArtifact(string sourcePath, string targetPath, Size? size = null)
        {
            FilePath = sourcePath;
            TargetFilePath = targetPath;
            Size = size ?? new Size(240, 160);

            var info = new FileInfo(FilePath);

            Id = targetPath;
            Checksum = CreateChecksum(new object[] {info.Length, info.LastWriteTimeUtc.ToBinary(), Size.Width, Size.Height});
        }

        public string FilePath { get; }
        public string TargetFilePath { get; }
        public Size Size { get; }

        public bool RequiresFinalize()
        {
            if (!File.Exists(TargetFilePath))
            {
                return true;
            }

            var sourceInfo = new FileInfo(FilePath);
            var targetInfo = new FileInfo(TargetFilePath);

            return sourceInfo.LastWriteTimeUtc != targetInfo.LastWriteTimeUtc;
        }

        public async Task<bool> Finalize(CancellationToken token)
        {
            var dir = Path.GetDirectoryName(TargetFilePath);

            if (dir != null)
            {
                Directory.CreateDirectory(dir);
            }

            var sourceInfo = new FileInfo(FilePath);

            if (!Directory.Exists(FilePath) && File.Exists(FilePath))
            {
                try
                {
                    var sourceImage = await Image.LoadAsync(FilePath, token);
                    var (width, height) = sourceImage.Width > sourceImage.Height
                        ? new Size(Math.Min(sourceImage.Width, Size.Width), 0)
                        : new Size(0, Math.Min(sourceImage.Height, Size.Height));

                    sourceImage.Mutate(x => x.Resize(width, height, KnownResamplers.Robidoux));

                    await sourceImage.SaveAsync(TargetFilePath, token);
                }
                catch (ArgumentOutOfRangeException)
                {
                    // Image dimensions larger than int64.
                    throw new Exception("Image is too large to load.");
                }
                catch (UnknownImageFormatException)
                {
                    return false;
                }
            }

            if (!File.Exists(TargetFilePath))
            {
                throw new Exception("Target thumbnail is missing.");
            }

            File.SetLastWriteTimeUtc(TargetFilePath, sourceInfo.LastWriteTimeUtc);

            return true;
        }
    }
}