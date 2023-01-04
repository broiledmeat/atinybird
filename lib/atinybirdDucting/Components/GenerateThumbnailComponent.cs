using System.IO;
using System.Threading;
using System.Threading.Tasks;
using atinybirdDucting.Artifacts;
using ductwork;
using ductwork.Artifacts;
using ductwork.Components;
using ductwork.Executors;

namespace atinybirdDucting.Components
{
    public class GenerateThumbnailComponent : SingleInSingleOutComponent
    {
        public Setting<string> SourceRoot = new();
        public Setting<string> TargetRoot = new();
        
        protected override async Task ExecuteIn(IExecutor executor, IArtifact artifact, CancellationToken token)
        {
            if (artifact is not IFilePathArtifact filePathArtifact)
            {
                return;
            }
            
            var relativePath = Path.GetRelativePath(SourceRoot, filePathArtifact.FilePath); 
            var targetPath = Path.Combine(
                TargetRoot, 
                Path.GetDirectoryName(relativePath) ?? string.Empty,
                ".thumb",
                Path.GetFileNameWithoutExtension(relativePath) + ".png");
            var thumbnailArtifact = new ThumbnailArtifact(filePathArtifact.FilePath, targetPath);
            await executor.Push(Out, thumbnailArtifact);
        }
    }
}