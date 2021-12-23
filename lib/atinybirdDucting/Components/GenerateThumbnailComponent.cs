using System.IO;
using System.Threading;
using System.Threading.Tasks;
using atinybirdDucting.Artifacts;
using ductwork;
using ductwork.Artifacts;
using ductwork.Components;

namespace atinybirdDucting.Components
{
    public class GenerateThumbnailComponent : SingleInSingleOutComponent
    {
        public string SourceRoot { get; }
        public string TargetRoot { get; }
    
        public GenerateThumbnailComponent(string sourceRoot, string targetRoot)
        {
            SourceRoot = sourceRoot;
            TargetRoot = targetRoot;
        }
        
        protected override async Task ExecuteIn(Graph graph, IArtifact artifact, CancellationToken token)
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
            await graph.Push(Out, thumbnailArtifact);
        }
    }
}